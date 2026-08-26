package server

import (
	"net"
	"testing"

	"github.com/pranav718/tunneru/internal/mux"
)

type mockAddr struct {
	addr string
}

func (m mockAddr) Network() string { return "tcp" }
func (m mockAddr) String() string  { return m.addr }

func TestValidateSubdomain(t *testing.T) {
	valid := []string{"myapp", "dev-test", "api2", "user-123-app", "cool"}
	for _, s := range valid {
		if err := ValidateSubdomain(s); err != nil {
			t.Errorf("expected valid subdomain %q, got error: %v", s, err)
		}
	}

	invalid := []string{
		"a",
		"ab",
		"toolongsubdomainnamethatexceedsthirtytwocharacterslong",
		"-leading-hyphen",
		"trailing-hyphen-",
		"has_underscore",
		"has.dot",
		"has/slash",
		"has space",
		"admin",
		"api",
		"relay",
		"www",
		"localhost",
		"tunneru",
	}
	for _, s := range invalid {
		if err := ValidateSubdomain(s); err == nil {
			t.Errorf("expected invalid subdomain %q to fail validation, but it passed", s)
		}
	}
}

func TestMaxTunnelsPerIP(t *testing.T) {
	reg := NewRegistry("tunneru.knightkun.codes")

	for i := 0; i < MaxTunnelsPerIP; i++ {
		client, serverConn := net.Pipe()
		defer client.Close()
		defer serverConn.Close()

		session := mux.Server(serverConn)
		defer session.Close()

		_, err := reg.Register("", serverConn, session)
		if err != nil {
			t.Fatalf("failed to register tunnel %d: %v", i, err)
		}
	}

	client, serverConn := net.Pipe()
	defer client.Close()
	defer serverConn.Close()

	session := mux.Server(serverConn)
	defer session.Close()

	_, err := reg.Register("", serverConn, session)
	if err == nil {
		t.Fatalf("expected registration to fail after exceeding MaxTunnelsPerIP, but it succeeded")
	}
}
