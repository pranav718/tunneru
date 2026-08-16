package tui

import (
	"net/http"
	"time"
)

type RequestEvent struct {
	ID              string
	Timestamp       time.Time
	Method          string
	Path            string
	StatusCode      int
	StatusText      string
	LatencyMs       int
	ContentLength   int64
	RequestBody     []byte
	ResponseBody    []byte
	RequestHeaders  http.Header
	ResponseHeaders http.Header
}

type StatusEvent struct {
	Status  string
	Message string
}

type EventMsg struct {
	Type    string
	Request *RequestEvent
	Status  *StatusEvent
}
