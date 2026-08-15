package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/proto"
)

type ControlServer struct { //manages client tunnel connections over tcp
	addr     string
	domain   string
	registry *Registry
}

func NewControlServer(addr string, domain string) *ControlServer {
	return &ControlServer{
		addr:     addr,
		domain:   domain,
		registry: NewRegistry(domain),
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

	log.Printf("api server listening on :7002")

	if err := http.ListenAndServe(":7002", muxRouter); err != nil {
		log.Printf("api server error: %v", err)
	}
}

func (s *ControlServer) handleTunnelList(w http.ResponseWriter, r *http.Request) {
	tunnels := s.registry.ActiveTunnels()

	type tunnelResponse struct {
		Subdomain  string `json:"subdomain"`
		URL        string `json:"url"`
		RemoteAddr string `json:"remote_addr"`
	}

	resp := make([]tunnelResponse, len(tunnels))
	
	for i, t := range tunnels {
		resp[i] = tunnelResponse{
			Subdomain:  t.Subdomain,
			URL:        t.URL,
			RemoteAddr: t.RemoteAddr,
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


	msg, err := proto.Decode(conn)
	if err != nil {
		log.Printf("client read initial message error (%s): %v", remoteAddr, err)
		return
	}

	if msg.Type != proto.TypeRegister {
		log.Printf("client %s expected register message, got %s", remoteAddr, msg.Type)
		return
	}

	session := mux.Server(conn)
	defer session.Close()

	info, regErr := s.registry.Register(msg.Subdomain, conn, session)
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
	_ = resp

	<-session.AcceptStreamChan() 
}
