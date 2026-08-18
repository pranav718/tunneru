package server

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
)

type AuthManager struct {
	mu          sync.RWMutex
	requireAuth bool
	tokenMap    map[string]string
}

func NewAuthManager(rawTokens string, tokenFilePath string) (*AuthManager, error) {
	am := &AuthManager{
		tokenMap: make(map[string]string),
	}

	if rawTokens != "" {
		am.requireAuth = true
		tokens := strings.Split(rawTokens, ",")
		for _, item := range tokens {
			item = strings.TrimSpace(item)
			if item == "" {
				continue
			}
			parts := strings.SplitN(item, ":", 2)
			token := strings.TrimSpace(parts[0])
			subdomain := ""
			if len(parts) == 2 {
				subdomain = strings.TrimSpace(parts[1])
			}
			am.tokenMap[token] = subdomain
		}
	}

	if tokenFilePath != "" {
		am.requireAuth = true
		data, err := os.ReadFile(tokenFilePath)
		if err != nil {
			return nil, fmt.Errorf("read auth file: %w", err)
		}
		var fileTokens map[string]string
		if err := json.Unmarshal(data, &fileTokens); err != nil {
			return nil, fmt.Errorf("parse auth file: %w", err)
		}
		for k, v := range fileTokens {
			am.tokenMap[strings.TrimSpace(k)] = strings.TrimSpace(v)
		}
	}

	return am, nil
}

func (am *AuthManager) Validate(token string, requestedSubdomain string) (string, error) {
	am.mu.RLock()
	defer am.mu.RUnlock()

	if !am.requireAuth {
		return requestedSubdomain, nil
	}

	token = strings.TrimSpace(token)
	if token == "" {
		return "", fmt.Errorf("authentication required: missing auth token")
	}

	reservedSubdomain, exists := am.tokenMap[token]
	if !exists {
		return "", fmt.Errorf("invalid auth token")
	}

	if reservedSubdomain != "" {
		if requestedSubdomain != "" && requestedSubdomain != reservedSubdomain {
			return "", fmt.Errorf("token is restricted to subdomain '%s'", reservedSubdomain)
		}
		return reservedSubdomain, nil
	}

	return requestedSubdomain, nil
}
