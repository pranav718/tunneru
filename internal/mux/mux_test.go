package mux

import (
	"fmt"
	"io"
	"net"
	"sync"
	"testing"
)

func TestConcurrentStreams(t *testing.T) {
	serverConn, clientConn := net.Pipe()

	serverSession := Server(serverConn)
	clientSession := Client(clientConn)

	defer serverSession.Close()
	defer clientSession.Close()

	const numStreams = 5
	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < numStreams; i++ {
			stream, err := serverSession.AcceptStream()
			if err != nil {
				t.Errorf("accept stream: %v", err)
				return
			}
			go func(s *Stream) {
				defer s.Close()
				data, err := io.ReadAll(s)
				if err != nil {
					t.Errorf("server read: %v", err)
					return
				}
				response := fmt.Sprintf("echo:%s", string(data))
				s.Write([]byte(response))
			}(stream)
		}
	}()

	var clientWg sync.WaitGroup
	for i := 0; i < numStreams; i++ {
		clientWg.Add(1)
		go func(idx int) {
			defer clientWg.Done()

			stream, err := clientSession.OpenStream()
			if err != nil {
				t.Errorf("open stream %d: %v", idx, err)
				return
			}

			msg := fmt.Sprintf("hello-from-stream-%d", idx)
			stream.Write([]byte(msg))

			stream.session.writeFrame(&frame{
				StreamID:  stream.id,
				FrameType: frameStreamClose,
			})

			resp, err := io.ReadAll(stream)
			if err != nil {
				t.Errorf("client read stream %d: %v", idx, err)
				return
			}

			expected := fmt.Sprintf("echo:%s", msg)
			if string(resp) != expected {
				t.Errorf("stream %d: got %q, want %q", idx, string(resp), expected)
			}
		}(i)
	}

	clientWg.Wait()
	wg.Wait()
}
