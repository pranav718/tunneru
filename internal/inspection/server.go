package inspection

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type Server struct {
	addr      string
	localPort int
	store     *Store
	hub       *Hub
	client    *http.Client
}

func NewServer(addr string, localPort int) *Server {
	return &Server{
		addr:      addr,
		localPort: localPort,
		store:     NewStore(100),
		hub:       NewHub(),
		client: &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}
}

func (s *Server) Store() *Store {
	return s.store
}

func (s *Server) Record(record *RequestRecord) {
	s.store.Add(record)
	s.hub.Broadcast(record)
}

func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "http://localhost:3000/inspect", http.StatusTemporaryRedirect)
			return
		}
		http.NotFound(w, r)
	})
	mux.HandleFunc("/api/requests", s.handleRequests)
	mux.HandleFunc("/api/requests/", s.handleSingleRequest)
	mux.HandleFunc("/ws", s.handleWebSocket)

	handler := s.enableCORS(mux)
	log.Printf("inspection server listening on %s", s.addr)
	return http.ListenAndServe(s.addr, handler)
}

func (s *Server) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleRequests(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		records := s.store.List()
		json.NewEncoder(w).Encode(records)
	case http.MethodDelete:
		s.store.Clear()
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "cleared"})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleSingleRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	path := strings.TrimPrefix(r.URL.Path, "/api/requests/")

	if strings.HasSuffix(path, "/replay") && r.Method == http.MethodPost {
		id := strings.TrimSuffix(path, "/replay")
		s.handleReplay(w, r, id)
		return
	}

	id := path
	record := s.store.Get(id)
	if record == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "request not found"})
		return
	}

	json.NewEncoder(w).Encode(record)
}

func (s *Server) handleReplay(w http.ResponseWriter, r *http.Request, id string) {
	record := s.store.Get(id)
	if record == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "original request not found"})
		return
	}

	targetURL := fmt.Sprintf("http://127.0.0.1:%d%s", s.localPort, record.Path)
	if record.Query != "" {
		targetURL += "?" + record.Query
	}

	var bodyReader io.Reader
	if len(record.RequestBody) > 0 {
		bodyReader = bytes.NewReader([]byte(record.RequestBody))
	}

	req, err := http.NewRequest(record.Method, targetURL, bodyReader)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	for k, v := range record.RequestHeaders {
		req.Header[k] = v
	}
	req.Host = fmt.Sprintf("localhost:%d", s.localPort)

	start := time.Now()
	resp, err := s.client.Do(req)
	latency := time.Since(start)

	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	respBodyBytes, _ := io.ReadAll(resp.Body)

	replayedRecord := &RequestRecord{
		ID:              fmt.Sprintf("%d", time.Now().UnixNano()),
		Timestamp:       time.Now(),
		Method:          req.Method,
		Path:            req.URL.Path,
		Query:           req.URL.RawQuery,
		Proto:           req.Proto,
		RequestHeaders:  req.Header,
		RequestBody:     record.RequestBody,
		ResponseHeaders: resp.Header,
		ResponseBody:    string(respBodyBytes),
		StatusCode:      resp.StatusCode,
		StatusText:      http.StatusText(resp.StatusCode),
		LatencyMs:       int(latency.Milliseconds()),
		ContentLength:   resp.ContentLength,
	}

	s.Record(replayedRecord)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(replayedRecord)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}
	s.hub.AddClient(conn)
}
