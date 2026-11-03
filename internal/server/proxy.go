package server

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

type HTTPProxy struct {
	addr     string
	domain   string
	registry *Registry
}

var proxyReaderPool = sync.Pool{
	New: func() any {
		return bufio.NewReaderSize(nil, 4096)
	},
}

func NewHTTPProxy(addr string, domain string, registry *Registry) *HTTPProxy {
	return &HTTPProxy{
		addr:     addr,
		domain:   domain,
		registry: registry,
	}
}

func (p *HTTPProxy) Start() error {
	log.Printf("http proxy listening on %s (domain: *.%s)", p.addr, p.domain)
	server := &http.Server{
		Addr:              p.addr,
		Handler:           p,
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	return server.ListenAndServe()
}

func (p *HTTPProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	subdomain := ExtractSubdomain(r.Host, p.domain)
	if subdomain == "" {
		http.Error(w, fmt.Sprintf("tunneru: no tunnel specified for host %q", r.Host), http.StatusNotFound)
		return
	}

	tunnel := p.registry.Lookup(subdomain)
	if tunnel == nil || tunnel.Session == nil {
		http.Error(w, fmt.Sprintf("tunneru: tunnel %q is offline or not found", subdomain), http.StatusBadGateway)
		return
	}

	stream, err := tunnel.Session.OpenStream()
	if err != nil {
		log.Printf("proxy [%s]: failed to open mux stream: %v", subdomain, err)
		http.Error(w, "tunneru: failed to establish stream to client", http.StatusBadGateway)
		return
	}
	defer stream.Close()

	ctx := r.Context()
	done := make(chan struct{})
	defer close(done)

	go func() {
		select {
		case <-ctx.Done():
			stream.Close()
		case <-done:
		}
	}()

	if err := r.Write(stream); err != nil {
		log.Printf("proxy [%s]: failed to write request to stream: %v", subdomain, err)
		http.Error(w, "tunneru: error forwarding request", http.StatusBadGateway)
		return
	}

	respReader := proxyReaderPool.Get().(*bufio.Reader)
	respReader.Reset(stream)
	defer proxyReaderPool.Put(respReader)

	resp, err := http.ReadResponse(respReader, r)
	if err != nil {
		log.Printf("proxy [%s]: failed to read response from stream: %v", subdomain, err)
		http.Error(w, "tunneru: bad response from client", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)

	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}

	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("proxy [%s]: error copying response body: %v", subdomain, err)
	}
}
