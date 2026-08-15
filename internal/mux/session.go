package mux

import (
	"fmt"
	"io"
	"log"
	"net"
	"sync"
	"sync/atomic"
)

type Session struct {
	conn net.Conn

	streamMu sync.Mutex
	streams  map[uint32]*Stream

	acceptCh chan *Stream

	writeMu sync.Mutex

	nextID uint32

	closed atomic.Bool
}

func Server(conn net.Conn) *Session {
	s := newSession(conn, 1)
	go s.recvLoop()
	return s
}

func Client(conn net.Conn) *Session {
	s := newSession(conn, 2)
	go s.recvLoop()
	return s
}

func newSession(conn net.Conn, startID uint32) *Session {
	return &Session{
		conn:     conn,
		streams:  make(map[uint32]*Stream),
		acceptCh: make(chan *Stream, 32),
		nextID:   startID,
	}
}

func (s *Session) OpenStream() (*Stream, error) {
	if s.closed.Load() {
		return nil, fmt.Errorf("session closed")
	}

	id := atomic.AddUint32(&s.nextID, 2) - 2 

	stream := newStream(id, s)

	s.streamMu.Lock()
	s.streams[id] = stream
	s.streamMu.Unlock()

	err := s.writeFrame(&frame{
		StreamID:  id,
		FrameType: frameStreamOpen,
	})
	if err != nil {
		s.removeStream(id)
		return nil, fmt.Errorf("mux open stream: %w", err)
	}

	return stream, nil
}

func (s *Session) AcceptStream() (*Stream, error) {
	stream, ok := <-s.acceptCh
	if !ok {
		return nil, fmt.Errorf("session closed")
	}
	return stream, nil
}

func (s *Session) AcceptStreamChan() <-chan *Stream {
	return s.acceptCh
}


func (s *Session) Close() error {
	if s.closed.Swap(true) {
		return nil
	}

	s.streamMu.Lock()
	for _, stream := range s.streams {
		close(stream.dataCh)
	}
	s.streams = make(map[uint32]*Stream)
	s.streamMu.Unlock()

	close(s.acceptCh)
	return s.conn.Close()
}

func (s *Session) writeFrame(f *frame) error {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()
	return writeFrame(s.conn, f)
}

func (s *Session) removeStream(id uint32) {
	s.streamMu.Lock()
	delete(s.streams, id)
	s.streamMu.Unlock()
}

func (s *Session) recvLoop() {
	defer s.Close()

	for {
		f, err := readFrame(s.conn)
		if err != nil {
			if !s.closed.Load() {
				if err != io.EOF {
					log.Printf("mux recv error: %v", err)
				}
			}
			return
		}

		switch f.FrameType {
		case frameStreamOpen:
			stream := newStream(f.StreamID, s)
			s.streamMu.Lock()
			s.streams[f.StreamID] = stream
			s.streamMu.Unlock()

			select {
			case s.acceptCh <- stream:
			default:
				log.Printf("mux: accept buffer full, dropping stream %d", f.StreamID)
				stream.Close()
			}

		case frameStreamData:
			s.streamMu.Lock()
			stream, ok := s.streams[f.StreamID]
			s.streamMu.Unlock()

			if ok {
				stream.deliver(f.Payload)
			}

		case frameStreamClose:
			s.streamMu.Lock()
			stream, ok := s.streams[f.StreamID]
			s.streamMu.Unlock()

			if ok {
				stream.closeRemote()
				s.removeStream(f.StreamID)
			}

		case frameStreamReset:
			s.streamMu.Lock()
			stream, ok := s.streams[f.StreamID]
			s.streamMu.Unlock()

			if ok {
				stream.resetRemote(ErrStreamReset)
				s.removeStream(f.StreamID)
			}
		}
	}
}
