package mux

import (
	"errors"
	"io"
	"sync"
)

var (
	ErrStreamClosed = errors.New("stream closed")
	ErrStreamReset  = errors.New("stream reset by remote")
)

type Stream struct {
	id      uint32
	session *Session

	dataCh chan []byte // incoming data is queued here by the session's recvLoop

	readBuf []byte // leftover bytes from a partially-read data chunk

	closeMu    sync.Mutex
	remoteEOF  bool // remote sent StreamClose
	localClose bool // we called Close()
	resetErr   error
}

func newStream(id uint32, session *Session) *Stream {
	return &Stream{
		id:      id,
		session: session,
		dataCh:  make(chan []byte, 64),
	}
}

func (s *Stream) ID() uint32 {
	return s.id
}

func (s *Stream) Read(p []byte) (int, error) {
	if len(s.readBuf) > 0 {
		n := copy(p, s.readBuf)
		s.readBuf = s.readBuf[n:]
		return n, nil
	}

	data, ok := <-s.dataCh
	if !ok {
		s.closeMu.Lock()
		err := s.resetErr
		s.closeMu.Unlock()

		if err != nil {
			return 0, err
		}
		return 0, io.EOF
	}

	n := copy(p, data)
	if n < len(data) {
		s.readBuf = data[n:]
	}
	return n, nil
}

func (s *Stream) Write(p []byte) (int, error) {
	s.closeMu.Lock()
	closed := s.localClose
	s.closeMu.Unlock()

	if closed {
		return 0, ErrStreamClosed
	}

	payload := make([]byte, len(p)) // copy the data so the caller can reuse their buffer
	copy(payload, p)

	err := s.session.writeFrame(&frame{
		StreamID:  s.id,
		FrameType: frameStreamData,
		Payload:   payload,
	})
	if err != nil {
		return 0, err
	}

	return len(p), nil
}

func (s *Stream) Close() error {
	s.closeMu.Lock()
	if s.localClose {
		s.closeMu.Unlock()
		return nil
	}
	s.localClose = true
	s.closeMu.Unlock()

	s.session.writeFrame(&frame{
		StreamID:  s.id,
		FrameType: frameStreamClose,
	})

	s.session.removeStream(s.id)
	return nil
}
func (s *Stream) deliver(data []byte) {
	select {
	case s.dataCh <- data:
	default:
		
	}
}

func (s *Stream) closeRemote() {
	s.closeMu.Lock()
	s.remoteEOF = true
	s.closeMu.Unlock()
	close(s.dataCh)
}

func (s *Stream) resetRemote(err error) {
	s.closeMu.Lock()
	s.resetErr = err
	s.closeMu.Unlock()
	close(s.dataCh)
}
