package mux

import (
	"bytes"
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

func TestWriteFrameVariants(t *testing.T) {
	cases := []struct {
		name      string
		streamID  uint32
		frameType byte
		payload   []byte
	}{
		{
			name:      "empty",
			streamID:  1,
			frameType: frameStreamOpen,
			payload:   nil,
		},
		{
			name:      "small",
			streamID:  3,
			frameType: frameStreamData,
			payload:   []byte("hello world"),
		},
		{
			name:      "large_exceeding_pool",
			streamID:  5,
			frameType: frameStreamData,
			payload:   bytes.Repeat([]byte("x"), 64*1024),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var buf bytes.Buffer
			f := &frame{
				StreamID:  tc.streamID,
				FrameType: tc.frameType,
				Payload:   tc.payload,
			}

			if err := writeFrame(&buf, f); err != nil {
				t.Fatalf("writeFrame failed: %v", err)
			}

			decoded, err := readFrame(&buf)
			if err != nil {
				t.Fatalf("readFrame failed: %v", err)
			}

			if decoded.StreamID != tc.streamID {
				t.Errorf("expected streamID %d, got %d", tc.streamID, decoded.StreamID)
			}
			if decoded.FrameType != tc.frameType {
				t.Errorf("expected frameType %d, got %d", tc.frameType, decoded.FrameType)
			}
			if !bytes.Equal(decoded.Payload, tc.payload) {
				t.Errorf("payload mismatch, expected %d bytes, got %d bytes", len(tc.payload), len(decoded.Payload))
			}
		})
	}
}

func BenchmarkWriteFrame(b *testing.B) {
	payload := []byte("hello world benchmarking payload")
	f := &frame{
		StreamID:  42,
		FrameType: frameStreamData,
		Payload:   payload,
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if err := writeFrame(io.Discard, f); err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkSessionThroughput(b *testing.B) {
	serverConn, clientConn := net.Pipe()
	serverSession := Server(serverConn)
	clientSession := Client(clientConn)

	defer serverSession.Close()
	defer clientSession.Close()

	payload := make([]byte, 1024)
	for i := range payload {
		payload[i] = 'a'
	}

	go func() {
		for {
			stream, err := serverSession.AcceptStream()
			if err != nil {
				return
			}
			go func(s *Stream) {
				defer s.Close()
				buf := make([]byte, 1024)
				for {
					n, err := s.Read(buf)
					if n > 0 {
						s.Write(buf[:n])
					}
					if err != nil {
						return
					}
				}
			}(stream)
		}
	}()

	stream, err := clientSession.OpenStream()
	if err != nil {
		b.Fatal(err)
	}
	defer stream.Close()

	buf := make([]byte, 1024)
	b.SetBytes(1024)
	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		if _, err := stream.Write(payload); err != nil {
			b.Fatal(err)
		}
		if _, err := io.ReadFull(stream, buf); err != nil {
			b.Fatal(err)
		}
	}
}
