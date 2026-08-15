package server

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net"
	"sync"
	
	"github.com/pranav718/tunneru/internal/mux"
)

const subdomainChars = "abcdefghijklmnopqrstuvwxyz0123456789"
const subdomainLength = 6

type TunnelInfo struct {
	Subdomain  string
	URL        string
	Conn       net.Conn
	Session    *mux.Session
	RemoteAddr string
}

type Registry struct {
	mu      sync.RWMutex
	tunnels map[string]*TunnelInfo
	domain  string
}

func NewRegistry(domain string) *Registry {
	return &Registry{
		tunnels: make(map[string]*TunnelInfo),
		domain:  domain,
	}
}

func (r *Registry) Register(subdomain string, conn net.Conn, session *mux.Session) (*TunnelInfo, error) { //this gonna add a tunnel to the registry//if subdomain is empty then create a random one and some more obvious stuffs
	r.mu.Lock()
	defer r.mu.Unlock()

	if subdomain == "" {
		var err error
		subdomain, err = r.generateSubdomain()
		if err != nil {
			return nil, fmt.Errorf("registry generate subdomain: %w", err)
		}
	}

	if _, exists := r.tunnels[subdomain]; exists {
		return nil, fmt.Errorf("subdomain %q already taken", subdomain)
	}

	info := &TunnelInfo{
		Subdomain:  subdomain,
		URL:        fmt.Sprintf("%s.%s", subdomain, r.domain),
		Conn:       conn,
		Session:    session,
		RemoteAddr: conn.RemoteAddr().String(),
	}

	r.tunnels[subdomain] = info
	log.Printf("registry: registered %s (%s)", subdomain, info.RemoteAddr)

	return info, nil
}

func (r *Registry) Deregister(subdomain string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if info, exists := r.tunnels[subdomain]; exists {
		delete(r.tunnels, subdomain)
		log.Printf("registry: deregistered %s (%s)", subdomain, info.RemoteAddr)
	}
}

func (r *Registry) Lookup(subdomain string) *TunnelInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.tunnels[subdomain]
}

func (r *Registry) ActiveTunnels() []*TunnelInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	tunnels := make([]*TunnelInfo, 0, len(r.tunnels))
	for _, info := range r.tunnels {
		tunnels = append(tunnels, info)
	}

	return tunnels
}

func (r *Registry) generateSubdomain() (string, error) {
	for attempts := 0; attempts < 10; attempts++ {
		sub := make([]byte, subdomainLength)

		for i := range sub {
			idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(subdomainChars))))
			if err != nil {
				return "", err
			}
			sub[i] = subdomainChars[idx.Int64()]
		}
		candidate := string(sub)

		if _, exists := r.tunnels[candidate]; !exists {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("failed to generate unique subdomain after 10 attempts")
}