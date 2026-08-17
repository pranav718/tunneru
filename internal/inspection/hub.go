package inspection

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (h *Hub) AddClient(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[conn] = true
}

func (h *Hub) RemoveClient(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.clients[conn]; ok {
		delete(h.clients, conn)
		conn.Close()
	}
}

func (h *Hub) Broadcast(record *RequestRecord) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	data, err := json.Marshal(record)
	if err != nil {
		return
	}

	for conn := range h.clients {
		err := conn.WriteMessage(websocket.TextMessage, data)
		if err != nil {
			go h.RemoveClient(conn)
		}
	}
}
