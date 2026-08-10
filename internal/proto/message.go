package proto

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
)

const (
	TypeRegister   = "register"
	TypeRegistered = "registered"
	TypePing       = "ping"
	TypePong       = "pong"
	TypeError      = "error"
)

type Message struct {
	Type      string `json:"type"`
	Subdomain string `json:"subdomain,omitempty"`
	URL       string `json:"url,omitempty"`
	Error     string `json:"error,omitempty"`
}

func Encode(w io.Writer, msg *Message) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("proto encode marshal: %w", err)
	}

	length := uint32(len(body))
	if err := binary.Write(w, binary.BigEndian, length); err != nil {
		return fmt.Errorf("proto encode length: %w", err)
	}

	if _, err := w.Write(body); err != nil {
		return fmt.Errorf("proto encode body: %w", err)
	}

	return nil
}

func Decode(r io.Reader) (*Message, error) {
	var length uint32
	if err := binary.Read(r, binary.BigEndian, &length); err != nil {
		return nil, fmt.Errorf("proto decode length: %w", err)
	}

	if length > 16*1024*1024 {
		return nil, fmt.Errorf("proto decode: message too large (%d bytes)", length)
	}

	body := make([]byte, length)
	if _, err := io.ReadFull(r, body); err != nil {
		return nil, fmt.Errorf("proto decode body: %w", err)
	}

	var msg Message
	if err := json.Unmarshal(body, &msg); err != nil {
		return nil, fmt.Errorf("proto decode unmarshal: %w", err)
	}

	return &msg, nil
}
