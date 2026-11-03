package client

import (
	"bufio"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/pranav718/tunneru/internal/mux"
)

func TestForwarderSuccess(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Custom-Echo", r.Header.Get("X-Custom-Header"))
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("backend-response-ok"))
	}))
	defer ts.Close()

	parts := strings.Split(ts.Listener.Addr().String(), ":")
	port, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		t.Fatalf("failed to parse port: %v", err)
	}

	forwarder := NewForwarder(port)

	serverPipe, clientPipe := net.Pipe()
	serverSession := mux.Server(serverPipe)
	clientSession := mux.Client(clientPipe)

	defer serverSession.Close()
	defer clientSession.Close()

	errCh := make(chan error, 1)
	go func() {
		stream, err := serverSession.AcceptStream()
		if err != nil {
			errCh <- err
			return
		}
		forwarder.HandleStream(stream)
		errCh <- nil
	}()

	clientStream, err := clientSession.OpenStream()
	if err != nil {
		t.Fatalf("failed to open stream: %v", err)
	}

	rawReq := "GET /test-path HTTP/1.1\r\nHost: example.com\r\nX-Custom-Header: test-val\r\n\r\n"
	if _, err := clientStream.Write([]byte(rawReq)); err != nil {
		t.Fatalf("failed to write request: %v", err)
	}

	resp, err := http.ReadResponse(bufio.NewReader(clientStream), nil)
	if err != nil {
		t.Fatalf("failed to read response: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	if val := resp.Header.Get("X-Custom-Echo"); val != "test-val" {
		t.Errorf("expected echo header 'test-val', got %q", val)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}

	if string(body) != "backend-response-ok" {
		t.Errorf("expected 'backend-response-ok', got %q", string(body))
	}

	if err := <-errCh; err != nil {
		t.Fatalf("forwarder error: %v", err)
	}
}

func TestForwarderBadGateway(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	closedPort := ln.Addr().(*net.TCPAddr).Port
	ln.Close()

	forwarder := NewForwarder(closedPort)

	serverPipe, clientPipe := net.Pipe()
	serverSession := mux.Server(serverPipe)
	clientSession := mux.Client(clientPipe)

	defer serverSession.Close()
	defer clientSession.Close()

	go func() {
		stream, err := serverSession.AcceptStream()
		if err != nil {
			return
		}
		forwarder.HandleStream(stream)
	}()

	clientStream, err := clientSession.OpenStream()
	if err != nil {
		t.Fatalf("failed to open stream: %v", err)
	}

	rawReq := "GET /health HTTP/1.1\r\nHost: example.com\r\n\r\n"
	if _, err := clientStream.Write([]byte(rawReq)); err != nil {
		t.Fatalf("failed to write request: %v", err)
	}

	resp, err := http.ReadResponse(bufio.NewReader(clientStream), nil)
	if err != nil {
		t.Fatalf("failed to read response: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadGateway {
		t.Errorf("expected 502, got %d", resp.StatusCode)
	}
}
