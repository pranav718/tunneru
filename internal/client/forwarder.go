package client

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"

	"github.com/pranav718/tunneru/internal/mux"
)

type Forwarder struct {
	localPort  int
	httpClient *http.Client
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

	targetURL, err := url.Parse(fmt.Sprintf("http://127.0.0.1:%d%s", f.localPort, req.URL.RequestURI()))
	if err != nil {
		log.Printf("forwarder: invalid local url: %v", err)
		return
	}

	localReq, err := http.NewRequest(req.Method, targetURL.String(), req.Body)
	if err != nil {
		log.Printf("forwarder: failed to build local request: %v", err)
		return
	}

	localReq.Header = req.Header
	localReq.Host = fmt.Sprintf("localhost:%d", f.localPort)

	resp, err := f.httpClient.Do(localReq)
	if err != nil {
		log.Printf("forwarder: error connecting to localhost:%d: %v", f.localPort, err)
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

	if err := resp.Write(stream); err != nil {
		log.Printf("forwarder: error writing response to stream: %v", err)
	}
}
