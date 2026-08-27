package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/proto"
)

type ControlServer struct {
	addr     string
	domain   string
	registry *Registry
	auth     *AuthManager
}

func NewControlServer(addr string, domain string, auth *AuthManager) *ControlServer {
	return &ControlServer{
		addr:     addr,
		domain:   domain,
		registry: NewRegistry(domain),
		auth:     auth,
	}
}

func (s *ControlServer) Registry() *Registry {
	return s.registry
}

func (s *ControlServer) Start() error {
	listener, err := net.Listen("tcp", s.addr)
	if err != nil {
		return fmt.Errorf("control server listen: %w", err)
	}
	log.Printf("control server listening on %s", s.addr)

	go s.startAPI()

	for {
		conn, err := listener.Accept()
		if err != nil {
			return fmt.Errorf("control server accept: %w", err)
		}
		go s.handleClient(conn)
	}
}

func (s *ControlServer) startAPI() {
	muxRouter := http.NewServeMux()
	muxRouter.HandleFunc("/api/tunnels", s.handleTunnelList)
	muxRouter.HandleFunc("/api/tls-check", s.handleTLSCheck)

	log.Printf("api server listening on 127.0.0.1:7002")

	if err := http.ListenAndServe("127.0.0.1:7002", muxRouter); err != nil {
		log.Printf("api server error: %v", err)
	}
}

func (s *ControlServer) handleTLSCheck(w http.ResponseWriter, r *http.Request) {
	domainParam := r.URL.Query().Get("domain")
	if domainParam == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	subdomain := ExtractSubdomain(domainParam, s.domain)
	if subdomain == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	tunnel := s.registry.Lookup(subdomain)
	if tunnel == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *ControlServer) handleTunnelList(w http.ResponseWriter, r *http.Request) {
	tunnels := s.registry.ActiveTunnels()

	type tunnelResponse struct {
		Subdomain  string `json:"subdomain"`
		URL        string `json:"url"`
	}

	resp := make([]tunnelResponse, len(tunnels))
	for i, t := range tunnels {
		resp[i] = tunnelResponse{
			Subdomain:  t.Subdomain,
			URL:        t.URL,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *ControlServer) handleClient(conn net.Conn) {
	remoteAddr := conn.RemoteAddr().String()
	log.Printf("client connected: %s", remoteAddr)

	var registeredSubdomain string

	defer func() {
		conn.Close()
		if registeredSubdomain != "" {
			s.registry.Deregister(registeredSubdomain)
		}
		log.Printf("client disconnected: %s", remoteAddr)
	}()

	_ = conn.SetDeadline(time.Now().Add(10 * time.Second))

	msg, err := proto.Decode(conn)
	if err != nil {
		log.Printf("client read initial message error (%s): %v", remoteAddr, err)
		return
	}

	if msg.Type != proto.TypeRegister {
		log.Printf("client %s expected register message, got %s", remoteAddr, msg.Type)
		return
	}

	subdomain, authErr := s.auth.Validate(msg.AuthToken, msg.Subdomain)
	if authErr != nil {
		log.Printf("auth rejected for %s: %v", remoteAddr, authErr)
		errMsg := &proto.Message{
			Type:  proto.TypeError,
			Error: authErr.Error(),
		}
		_ = proto.Encode(conn, errMsg)
		return
	}

	session := mux.Server(conn)
	defer session.Close()

	info, regErr := s.registry.Register(subdomain, conn, session)
	if regErr != nil {
		errMsg := &proto.Message{Type: proto.TypeError, Error: regErr.Error()}
		log.Printf("register rejected for %s: %v", remoteAddr, regErr)
		_ = proto.Encode(conn, errMsg)
		return
	}
	registeredSubdomain = info.Subdomain
	resp := &proto.Message{
		Type:      proto.TypeRegistered,
		Subdomain: info.Subdomain,
		URL:       info.URL,
	}
	if err := proto.Encode(conn, resp); err != nil {
		log.Printf("failed to send registered response to %s: %v", remoteAddr, err)
		return
	}

	_ = conn.SetDeadline(time.Time{})

	<-session.AcceptStreamChan()
}
