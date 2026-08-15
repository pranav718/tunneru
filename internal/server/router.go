package server

import (
	"net"
	"strings"
)


func ExtractSubdomain(hostHeader string, baseDomain string) string {
	host := hostHeader
	if h, _, err := net.SplitHostPort(hostHeader); err == nil {
		host = h
	}

	host = strings.ToLower(strings.TrimSpace(host))
	baseDomain = strings.ToLower(strings.TrimSpace(baseDomain))

	if host == baseDomain || host == "localhost" || host == "127.0.0.1" {
		return ""
	}

	suffix := "." + baseDomain
	if strings.HasSuffix(host, suffix) {
		subdomain := strings.TrimSuffix(host, suffix)
		return subdomain
	}

	return ""
}
