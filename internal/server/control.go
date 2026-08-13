package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/pranav718/tunneru/internal/proto"
)

const heartbeatTimeout = 90 * time.Second

type ControlServer struct { //manages client tunnel connections over tcp
	addr     string
	registry *Registry
}

func NewControlServer(addr string, domain string) *ControlServer {
	return &ControlServer{addr: addr, registry: NewRegistry(domain)}
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
	mux := http.NewServeMux()
	mux.HandleFunc("/api/tunnels", s.handleTunnelList)

	log.Printf("api server listening on :7002")

	if err := http.ListenAndServe(":7002", mux); err != nil {
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

	// set initial read deadline for heartbeat timeout
	conn.SetReadDeadline(time.Now().Add(heartbeatTimeout))

	for {
		msg, err := proto.Decode(conn)
		if err != nil {
			log.Printf("client read error (%s): %v", remoteAddr, err)
			return
		}

		// reset deadline on any message received
		conn.SetReadDeadline(time.Now().Add(heartbeatTimeout))

		switch msg.Type {
		case proto.TypeRegister:
			info, regErr := s.registry.Register(msg.Subdomain, conn)
			if regErr != nil {
				errMsg := &proto.Message{Type: proto.TypeError, Error: regErr.Error()}
				proto.Encode(conn, errMsg)
				return
			}
			registeredSubdomain = info.Subdomain
			resp := &proto.Message{
				Type:      proto.TypeRegistered,
				Subdomain: info.Subdomain,
				URL:       info.URL,
			}
			if err := proto.Encode(conn, resp); err != nil {
				log.Printf("register response error (%s): %v", remoteAddr, err)
				return
			}

		case proto.TypePing:
			pong := &proto.Message{Type: proto.TypePong}
			if err := proto.Encode(conn, pong); err != nil {
				log.Printf("pong send error (%s): %v", remoteAddr, err)
				return
			}

		default:
			log.Printf("unknown message type from %s: %s", remoteAddr, msg.Type)
		}
	}
}

