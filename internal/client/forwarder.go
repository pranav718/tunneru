package client

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/pranav718/tunneru/internal/inspection"
	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/tui"
)

type Forwarder struct {
	localPort    int
	httpClient   *http.Client
	OnRequest    func(tui.RequestEvent)
	OnInspection func(*inspection.RequestRecord)
}

var readerPool = sync.Pool{
	New: func() any {
		return bufio.NewReaderSize(nil, 4096)
	},
}

func NewForwarder(localPort int) *Forwarder {
	transport := &http.Transport{
		Proxy: nil,
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     false,
		MaxIdleConns:          256,
		MaxIdleConnsPerHost:   128,
		IdleConnTimeout:       90 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
		DisableCompression:    true,
	}

	return &Forwarder{
		localPort: localPort,
		httpClient: &http.Client{
			Transport: transport,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}
}

func (f *Forwarder) HandleStream(stream *mux.Stream) {
	defer stream.Close()

	reader := readerPool.Get().(*bufio.Reader)
	reader.Reset(stream)
	defer readerPool.Put(reader)

	req, err := http.ReadRequest(reader)
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

	targetURL := &url.URL{
		Scheme:   "http",
		Host:     fmt.Sprintf("127.0.0.1:%d", f.localPort),
		Path:     req.URL.Path,
		RawQuery: req.URL.RawQuery,
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
			ID:             fmt.Sprintf("%d", time.Now().UnixNano()),
			Timestamp:      time.Now(),
			Method:         req.Method,
			Path:           req.URL.Path,
			Query:          req.URL.RawQuery,
			Proto:          req.Proto,
			RequestHeaders: req.Header,
			RequestBody:    string(reqBodyBytes),
			StatusCode:     502,
			StatusText:     "Bad Gateway",
			LatencyMs:      int(latency.Milliseconds()),
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

		errMsg := []byte("tunneru: 502 bad gateway (could not connect to localhost)\n")
		badGateway := &http.Response{
			StatusCode:    http.StatusBadGateway,
			Status:        "502 Bad Gateway",
			ProtoMajor:    1,
			ProtoMinor:    1,
			Header:        make(http.Header),
			Body:          io.NopCloser(bytes.NewReader(errMsg)),
			ContentLength: int64(len(errMsg)),
		}
		badGateway.Header.Set("Content-Type", "text/plain")
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
