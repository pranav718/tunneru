package server

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net"
	"sync"
)

const subdomainChars = "abcdefghijklmnopqrstuvwxyz0123456789"
const subdomainLength = 6

type TunnelInfo struct {
	Subdomain  string
	URL        string
	Conn       net.Conn
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

