package client

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/pranav718/tunneru/internal/inspection"
	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/tui"
)

type Forwarder struct {
	localPort   int
	httpClient  *http.Client
	OnRequest   func(tui.RequestEvent)
	OnInspection func(*inspection.RequestRecord)
}

func NewForwarder(localPort int) *Forwarder {
	return &Forwarder{
		localPort: localPort,
		httpClient: &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}
}

func (f *Forwarder) HandleStream(stream *mux.Stream) {
	defer stream.Close()

	reqReader := bufio.NewReader(stream)
	req, err := http.ReadRequest(reqReader)
	if err != nil {
		if err != io.EOF {
			log.Printf("forwarder: failed to parse request from stream: %v", err)
		}
		return
	}

	var reqBodyBytes []byte
	if req.Body != nil {
		reqBodyBytes, _ = io.ReadAll(req.Body)
		req.Body = io.NopCloser(bytes.NewReader(reqBodyBytes))
	}

	targetURL, err := url.Parse(fmt.Sprintf("http://127.0.0.1:%d%s", f.localPort, req.URL.RequestURI()))
	if err != nil {
		log.Printf("forwarder: invalid local url: %v", err)
		return
	}

	localReq, err := http.NewRequest(req.Method, targetURL.String(), bytes.NewReader(reqBodyBytes))
	if err != nil {
		log.Printf("forwarder: failed to build local request: %v", err)
		return
	}

	localReq.Header = req.Header
	localReq.Host = fmt.Sprintf("localhost:%d", f.localPort)

	start := time.Now()
	resp, err := f.httpClient.Do(localReq)
	latency := time.Since(start)

	if err != nil {
		log.Printf("forwarder: error connecting to localhost:%d: %v", f.localPort, err)

		record := &inspection.RequestRecord{
			ID:              fmt.Sprintf("%d", time.Now().UnixNano()),
			Timestamp:       time.Now(),
			Method:          req.Method,
			Path:            req.URL.Path,
			Query:           req.URL.RawQuery,
			Proto:           req.Proto,
			RequestHeaders:  req.Header,
			RequestBody:     string(reqBodyBytes),
			StatusCode:      502,
			StatusText:      "Bad Gateway",
			LatencyMs:       int(latency.Milliseconds()),
		}

		if f.OnInspection != nil {
			f.OnInspection(record)
		}

		if f.OnRequest != nil {
			f.OnRequest(tui.RequestEvent{
				Timestamp:  record.Timestamp,
				Method:     req.Method,
				Path:       req.URL.Path,
				StatusCode: 502,
				StatusText: "Bad Gateway",
				LatencyMs:  int(latency.Milliseconds()),
			})
		}

		badGateway := &http.Response{
			StatusCode: http.StatusBadGateway,
			ProtoMajor: 1,
			ProtoMinor: 1,
			Header:     make(http.Header),
			Body:       io.NopCloser(bufio.NewReader(nil)),
		}
		_ = badGateway.Write(stream)
		return
	}
	defer resp.Body.Close()

	respBodyBytes, _ := io.ReadAll(resp.Body)
	resp.Body = io.NopCloser(bytes.NewReader(respBodyBytes))

	record := &inspection.RequestRecord{
		ID:              fmt.Sprintf("%d", time.Now().UnixNano()),
		Timestamp:       time.Now(),
		Method:          req.Method,
		Path:            req.URL.Path,
		Query:           req.URL.RawQuery,
		Proto:           req.Proto,
		RequestHeaders:  req.Header,
		RequestBody:     string(reqBodyBytes),
		ResponseHeaders: resp.Header,
		ResponseBody:    string(respBodyBytes),
		StatusCode:      resp.StatusCode,
		StatusText:      http.StatusText(resp.StatusCode),
		LatencyMs:       int(latency.Milliseconds()),
		ContentLength:   resp.ContentLength,
	}

	if f.OnInspection != nil {
		f.OnInspection(record)
	}

	if f.OnRequest != nil {
		f.OnRequest(tui.RequestEvent{
			Timestamp:       record.Timestamp,
			Method:          req.Method,
			Path:            req.URL.Path,
			StatusCode:      resp.StatusCode,
			StatusText:      http.StatusText(resp.StatusCode),
			LatencyMs:       int(latency.Milliseconds()),
			ContentLength:   resp.ContentLength,
			RequestHeaders:  req.Header,
			ResponseHeaders: resp.Header,
		})
	}

	if err := resp.Write(stream); err != nil {
		log.Printf("forwarder: error writing response to stream: %v", err)
	}
}
