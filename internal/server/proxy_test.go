package server

import (
	"bufio"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/pranav718/tunneru/internal/mux"
)

func TestProxySubdomainNotFound(t *testing.T) {
	registry := NewRegistry("example.com")
	proxy := NewHTTPProxy(":8080", "example.com", registry)

	req := httptest.NewRequest(http.MethodGet, "http://example.com/api", nil)
	rec := httptest.NewRecorder()

	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

func TestProxyTunnelOffline(t *testing.T) {
	registry := NewRegistry("example.com")
	proxy := NewHTTPProxy(":8080", "example.com", registry)

	req := httptest.NewRequest(http.MethodGet, "http://testapp.example.com/api", nil)
	rec := httptest.NewRecorder()

	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Errorf("expected 502, got %d", rec.Code)
	}
}

func TestProxySuccessWithFlusher(t *testing.T) {
	registry := NewRegistry("example.com")
	proxy := NewHTTPProxy(":8080", "example.com", registry)

	serverPipe, clientPipe := net.Pipe()
	serverSession := mux.Server(serverPipe)
	clientSession := mux.Client(clientPipe)

	defer serverSession.Close()
	defer clientSession.Close()

	info, err := registry.Register("mytest", serverPipe, serverSession)
	if err != nil {
		t.Fatalf("failed to register tunnel: %v", err)
	}
	defer registry.Deregister(info.Subdomain)

	go func() {
		stream, err := clientSession.AcceptStream()
		if err != nil {
			return
		}
		defer stream.Close()

		req, err := http.ReadRequest(bufio.NewReader(stream))
		if err != nil {
			return
		}

		if req.URL.Path != "/stream-path" {
			return
		}

		resp := "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nX-Proxied: true\r\nContent-Length: 11\r\n\r\nhello-proxy"
		stream.Write([]byte(resp))
	}()

	req := httptest.NewRequest(http.MethodGet, "http://mytest.example.com/stream-path", nil)
	rec := httptest.NewRecorder()

	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	if rec.Header().Get("X-Proxied") != "true" {
		t.Errorf("expected X-Proxied header, got %q", rec.Header().Get("X-Proxied"))
	}

	body, err := io.ReadAll(rec.Body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}

	if string(body) != "hello-proxy" {
		t.Errorf("expected 'hello-proxy', got %q", string(body))
	}
}
