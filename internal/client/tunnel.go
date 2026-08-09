package client

import (
	"fmt"
	"io"
	"log"
	"net"
)

type Tunnel struct {
	serverAddr	string
	localPort	int
	conn		net.Conn
}

func NewTunnel(serverAddr string, localPort int) *Tunnel {
	return &Tunnel{
		serverAddr: serverAddr, localPort: localPort,
	}
}

func(t *Tunnel) Connect() error{	
	var err error
	t.conn, err = net.Dial("tcp", t.serverAddr)
	
	if err!=nil {
		return fmt.Errorf("tunnel connect: %w", err)
	}
	log.Printf("connected to server at %s", t.serverAddr)
	log.Printf("forwarding to localhost:%d", t.localPort)

	defer func() {
		t.conn.Close()
		log.Printf("tunnel closed")
	}()

	buf := make([]byte, 1024)
	for {
		_, err := t.conn.Read(buf)
		if err!=nil {
			if err!= io.EOF {
				log.Printf("server read error: %v", err)
			}
			return nil
		}
	}
}