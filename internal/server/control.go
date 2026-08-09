package server

import (
	"fmt"
	"io"
	"log"
	"net"
)

type ControlServer struct { //manages client tunnel connections over tcp
	addr     string
	listener net.Listener
}

func NewControlServer(addr string) *ControlServer {
	return &ControlServer{addr: addr}
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

	buf := make([]byte, 1024)
	for {
		_, err := conn.Read(buf)
		if err != nil {
			if err != io.EOF {
				log.Printf("client read error (%s): %v", remoteAddr, err)
			}
			return
		}
	}
}
