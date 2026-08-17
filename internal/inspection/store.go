package inspection

import (
	"net/http"
	"sync"
	"time"
)

type RequestRecord struct {
	ID              string              `json:"id"`
	Timestamp       time.Time           `json:"timestamp"`
	Method          string              `json:"method"`
	Path            string              `json:"path"`
	Query           string              `json:"query"`
	Proto           string              `json:"proto"`
	RequestHeaders  http.Header         `json:"request_headers"`
	RequestBody     string              `json:"request_body"`
	ResponseHeaders http.Header         `json:"response_headers"`
	ResponseBody    string              `json:"response_body"`
	StatusCode      int                 `json:"status_code"`
	StatusText      string              `json:"status_text"`
	LatencyMs       int                 `json:"latency_ms"`
	ContentLength   int64               `json:"content_length"`
}

type Store struct {
	mu       sync.RWMutex
	records  []*RequestRecord
	maxLimit int
}

func NewStore(maxLimit int) *Store {
	if maxLimit <= 0 {
		maxLimit = 100
	}
	return &Store{
		records:  make([]*RequestRecord, 0, maxLimit),
		maxLimit: maxLimit,
	}
}

func (s *Store) Add(record *RequestRecord) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.records = append(s.records, record)
	if len(s.records) > s.maxLimit {
		s.records = s.records[len(s.records)-s.maxLimit:]
	}
}

func (s *Store) List() []*RequestRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*RequestRecord, len(s.records))
	for i, r := range s.records {
		result[len(s.records)-1-i] = r
	}
	return result
}

func (s *Store) Get(id string) *RequestRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, r := range s.records {
		if r.ID == id {
			return r
		}
	}
	return nil
}

func (s *Store) Clear() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.records = s.records[:0]
}
