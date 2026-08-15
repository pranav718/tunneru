package client

import (
	"fmt"
	"log"
	"net"

	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/proto"
)

type Tunnel struct {
	serverAddr  string
	localPort   int
	subdomain   string
	forwarder  *Forwarder
}

func NewTunnel(serverAddr string, localPort int, subdomain string) *Tunnel {
	return &Tunnel{
		serverAddr: serverAddr,
		localPort:  localPort,
		subdomain:  subdomain,
		forwarder:  NewForwarder(localPort),
	}
}

func (t *Tunnel) Connect() error {
	conn, err := net.Dial("tcp", t.serverAddr)
	if err != nil {
		return fmt.Errorf("tunnel connect: %w", err)
	}
	log.Printf("connected to server at %s", t.serverAddr)

	defer conn.Close()

	reg := &proto.Message{
		Type:      proto.TypeRegister,
		Subdomain: t.subdomain,
	}
	if err := proto.Encode(conn, reg); err != nil {
		return fmt.Errorf("tunnel register send: %w", err)
	}

	session := mux.Client(conn)
	defer session.Close()

	log.Printf("tunnel active: forwarding traffic from server to localhost:%d", t.localPort)

	for {
		stream, err := session.AcceptStream()
		if err != nil {
			log.Printf("session closed: %v", err)
			return nil
		}

		go t.forwarder.HandleStream(stream)
	}
}