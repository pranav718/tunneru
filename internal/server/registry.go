package server

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net"
	"regexp"
	"strings"
	"sync"

	"github.com/pranav718/tunneru/internal/mux"
)

const subdomainChars = "abcdefghijklmnopqrstuvwxyz0123456789"
const subdomainLength = 6
const MaxTunnelsPerIP = 5
const MaxTotalTunnels = 1000

var subdomainRegex = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$`)

var reservedSubdomains = map[string]bool{
	"admin":     true,
	"api":       true,
	"relay":     true,
	"www":       true,
	"mail":      true,
	"tunneru":   true,
	"localhost": true,
	"control":   true,
	"server":    true,
	"proxy":     true,
	"internal":  true,
	"dashboard": true,
	"auth":      true,
	"ns1":       true,
	"ns2":       true,
	"static":    true,
	"assets":    true,
	"status":    true,
	"health":    true,
	"root":      true,
}

type TunnelInfo struct {
	Subdomain  string
	URL        string
	Conn       net.Conn
	Session    *mux.Session
	RemoteAddr string
	ClientIP   string
}

type Registry struct {
	mu       sync.RWMutex
	tunnels  map[string]*TunnelInfo
	ipCounts map[string]int
	domain   string
}

func NewRegistry(domain string) *Registry {
	return &Registry{
		tunnels:  make(map[string]*TunnelInfo),
		ipCounts: make(map[string]int),
		domain:   domain,
	}
}

func extractClientIP(remoteAddr string) string {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return remoteAddr
	}
	return host
}

func ValidateSubdomain(subdomain string) error {
	subdomain = strings.ToLower(strings.TrimSpace(subdomain))
	if len(subdomain) < 3 || len(subdomain) > 32 {
		return fmt.Errorf("subdomain must be between 3 and 32 characters")
	}
	if !subdomainRegex.MatchString(subdomain) {
		return fmt.Errorf("subdomain can only contain lowercase alphanumeric characters and hyphens")
	}
	if reservedSubdomains[subdomain] {
		return fmt.Errorf("subdomain %q is reserved", subdomain)
	}
	return nil
}

func (r *Registry) Register(subdomain string, conn net.Conn, session *mux.Session) (*TunnelInfo, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(r.tunnels) >= MaxTotalTunnels {
		return nil, fmt.Errorf("server at maximum capacity (%d tunnels)", MaxTotalTunnels)
	}

	remoteAddr := conn.RemoteAddr().String()
	clientIP := extractClientIP(remoteAddr)

	if r.ipCounts[clientIP] >= MaxTunnelsPerIP {
		return nil, fmt.Errorf("exceeded maximum active tunnels limit (%d per IP)", MaxTunnelsPerIP)
	}

	if subdomain != "" {
		subdomain = strings.ToLower(strings.TrimSpace(subdomain))
		if err := ValidateSubdomain(subdomain); err != nil {
			return nil, err
		}
	} else {
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
		RemoteAddr: remoteAddr,
		ClientIP:   clientIP,
	}

	r.tunnels[subdomain] = info
	r.ipCounts[clientIP]++
	log.Printf("registry: registered %s (%s, ip tunnels: %d)", subdomain, info.RemoteAddr, r.ipCounts[clientIP])

	return info, nil
}

func (r *Registry) Deregister(subdomain string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if info, exists := r.tunnels[subdomain]; exists {
		delete(r.tunnels, subdomain)
		clientIP := info.ClientIP
		if clientIP == "" {
			clientIP = extractClientIP(info.RemoteAddr)
		}
		if r.ipCounts[clientIP] > 0 {
			r.ipCounts[clientIP]--
			if r.ipCounts[clientIP] == 0 {
				delete(r.ipCounts, clientIP)
			}
		}
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
	for attempts := 0; attempts < 20; attempts++ {
		sub := make([]byte, subdomainLength)

		for i := range sub {
			idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(subdomainChars))))
			if err != nil {
				return "", err
			}
			sub[i] = subdomainChars[idx.Int64()]
		}
		candidate := string(sub)

		if !reservedSubdomains[candidate] {
			if _, exists := r.tunnels[candidate]; !exists {
				return candidate, nil
			}
		}
	}
	return "", fmt.Errorf("failed to generate unique subdomain after 20 attempts")
}