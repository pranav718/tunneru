package server

import (
	"fmt"
	"log"
	"net"

	"github.com/pranav718/tunneru/internal/proto"
)

type ControlServer struct { //manages client tunnel connections over tcp
	addr     string
	listener net.Listener
	domain   string
}

func NewControlServer(addr string, domain string) *ControlServer {
	return &ControlServer{addr: addr, domain: domain}
}

func (s *ControlServer) Start() error {
	var err error
	s.listener, err = net.Listen("tcp", s.addr)
	if err != nil {
		return fmt.Errorf("control server listen: %w", err)
	}
	log.Printf("control server listening on %s", s.addr)

	for {
		conn, err := s.listener.Accept()
		if err != nil {
			return fmt.Errorf("control server accept: %w", err)
		}
		go s.handleClient(conn)
	}
}

func (s *ControlServer) handleClient(conn net.Conn) {
	remoteAddr := conn.RemoteAddr().String()
	log.Printf("client connected: %s", remoteAddr)

	defer func() {
		conn.Close()
		log.Printf("client disconnected: %s", remoteAddr)
	}()

	for {
		msg, err := proto.Decode(conn)
		if err != nil {
			log.Printf("client read error (%s): %v", remoteAddr, err)
			return
		}

		switch msg.Type {

		case proto.TypeRegister:
			s.handleRegister(conn, remoteAddr, msg)

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

func (s *ControlServer) handleRegister(conn net.Conn, remoteAddr string, msg *proto.Message) {
	subdomain := msg.Subdomain
	if subdomain == "" {
		subdomain = "test"
	}
	url := fmt.Sprintf("%s.%s", subdomain, s.domain)
	log.Printf("client %s registered subdomain: %s (url: %s)", remoteAddr, subdomain, url)

	resp := &proto.Message{
		Type:      proto.TypeRegistered,
		Subdomain: subdomain,
		URL:       url,
	}

	if err := proto.Encode(conn, resp); err != nil {
		log.Printf("register response error (%s): %v", remoteAddr, err)
	}
}