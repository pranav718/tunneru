package client

import (
	"fmt"
	"log"
	"net"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/proto"
	"github.com/pranav718/tunneru/internal/tui"
)

type Tunnel struct {
	serverAddr string
	localPort  int
	subdomain  string
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

	tunnelURL := fmt.Sprintf("http://%s.localhost:8080", t.subdomain)
	if t.subdomain == "" {
		tunnelURL = "http://localhost:8080"
	}

	var program *tea.Program

	t.forwarder.OnRequest = func(event tui.RequestEvent) {
		tui.Send(program, tui.EventMsg{
			Type:    "request",
			Request: &event,
		})
	}

	go func() {
		tui.Send(program, tui.EventMsg{
			Type:   "status",
			Status: &tui.StatusEvent{Status: "connected"},
		})

		for {
			stream, err := session.AcceptStream()
			if err != nil {
				log.Printf("session closed: %v", err)
				tui.Send(program, tui.EventMsg{
					Type:   "status",
					Status: &tui.StatusEvent{Status: "disconnected"},
				})
				return
			}
			go t.forwarder.HandleStream(stream)
		}
	}()

	config := tui.TUIConfig{
		TunnelURL:  tunnelURL,
		LocalPort:  t.localPort,
		InspectURL: "http://localhost:4040",
	}
	return tui.Run(config, &program)
}