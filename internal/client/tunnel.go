package client

import (
	"fmt"
	"log"
	"net"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/pranav718/tunneru/internal/inspection"
	"github.com/pranav718/tunneru/internal/mux"
	"github.com/pranav718/tunneru/internal/proto"
	"github.com/pranav718/tunneru/internal/tui"
)

type Tunnel struct {
	serverAddr  string
	localPort   int
	subdomain   string
	authToken   string
	inspectAddr string
	forwarder   *Forwarder
	inspector   *inspection.Server
}

func NewTunnel(serverAddr string, localPort int, subdomain string, authToken string) *Tunnel {
	inspectAddr := "127.0.0.1:4040"
	inspector := inspection.NewServer(inspectAddr, localPort)

	return &Tunnel{
		serverAddr:  serverAddr,
		localPort:   localPort,
		subdomain:   subdomain,
		authToken:   authToken,
		inspectAddr: inspectAddr,
		forwarder:   NewForwarder(localPort),
		inspector:   inspector,
	}
}

func (t *Tunnel) Connect() error {
	go func() {
		if err := t.inspector.Start(); err != nil {
			log.Printf("inspect server error: %v", err)
		}
	}()

	conn, err := net.Dial("tcp", t.serverAddr)
	if err != nil {
		return fmt.Errorf("tunnel connect: %w", err)
	}

	defer conn.Close()

	reg := &proto.Message{
		Type:      proto.TypeRegister,
		Subdomain: t.subdomain,
		AuthToken: t.authToken,
	}
	if err := proto.Encode(conn, reg); err != nil {
		return fmt.Errorf("tunnel register send: %w", err)
	}

	resp, err := proto.Decode(conn)
	if err != nil {
		return fmt.Errorf("tunnel register response: %w", err)
	}

	if resp.Type == proto.TypeError {
		return fmt.Errorf("server registration rejected: %s", resp.Error)
	}

	session := mux.Client(conn)
	defer session.Close()

	tunnelURL := resp.URL
	if tunnelURL == "" {
		tunnelURL = fmt.Sprintf("http://%s.localhost:8080", resp.Subdomain)
		if resp.Subdomain == "" {
			tunnelURL = "http://localhost:8080"
		}
	}

	var program *tea.Program

	t.forwarder.OnInspection = func(record *inspection.RequestRecord) {
		t.inspector.Record(record)
	}

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
		InspectURL: fmt.Sprintf("http://%s", t.inspectAddr),
	}
	return tui.Run(config, &program)
}