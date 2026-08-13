package client

import (
	"fmt"
	"log"
	"net"
	"time"

	"github.com/pranav718/tunneru/internal/proto"
)

const (
	pingInterval = 30 * time.Second
)

type Tunnel struct {
	serverAddr  string
	localPort   int
	subdomain   string
	conn        net.Conn
}

func NewTunnel(serverAddr string, localPort int, subdomain string) *Tunnel {
	return &Tunnel{
		serverAddr: serverAddr,
		localPort:  localPort,
		subdomain:  subdomain,
	}
}

func (t *Tunnel) Connect() error {
	var err error
	t.conn, err = net.Dial("tcp", t.serverAddr)
	if err != nil {
		return fmt.Errorf("tunnel connect: %w", err)
	}
	log.Printf("connected to server at %s", t.serverAddr)

	defer func() {
		t.conn.Close()
		log.Printf("disconnected from server")
	}()

	reg := &proto.Message{
		Type:      proto.TypeRegister,
		Subdomain: t.subdomain,
	}
	if err := proto.Encode(t.conn, reg); err != nil {
		return fmt.Errorf("tunnel register send: %w", err)
	}

	resp, err := proto.Decode(t.conn)
	if err != nil {
		return fmt.Errorf("tunnel register response: %w", err)
	}

	switch resp.Type {
	case proto.TypeRegistered:
		log.Printf("tunnel active: %s", resp.URL)
		log.Printf("forwarding to localhost:%d", t.localPort)
	case proto.TypeError:
		return fmt.Errorf("registration rejected: %s", resp.Error)
	default:
		return fmt.Errorf("unexpected response type: %s", resp.Type)
	}

	// start heartbeat ping loop in background
	go t.pingLoop()

	// message loop
	for {
		msg, err := proto.Decode(t.conn)
		if err != nil {
			log.Printf("server read error: %v", err)
			return nil
		}

		switch msg.Type {
		case proto.TypePong:
			// heartbeat acknowledged
		default:
			log.Printf("unhandled message type: %s", msg.Type)
		}
	}
}

// pingLoop sends a ping to the server every 30 seconds
func (t *Tunnel) pingLoop() {
	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()

	for range ticker.C {
		ping := &proto.Message{Type: proto.TypePing}
		if err := proto.Encode(t.conn, ping); err != nil {
			log.Printf("ping send error: %v", err)
			return
		}
	}
}