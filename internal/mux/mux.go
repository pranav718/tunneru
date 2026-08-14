package mux

import (
	"encoding/binary"
	"fmt"
	"io"
)


const headerSize = 9 // frame header size: 4 (stream ID) + 4 (payload length) + 1 (type) = 9 bytes

const (
	frameStreamOpen  byte = 0x01
	frameStreamData  byte = 0x02
	frameStreamClose byte = 0x03
	frameStreamReset byte = 0x04
)

type frame struct {
	StreamID  uint32
	FrameType byte
	Payload   []byte
}

func writeFrame(w io.Writer, f *frame) error {
	var header [headerSize]byte
	binary.BigEndian.PutUint32(header[0:4], f.StreamID)
	binary.BigEndian.PutUint32(header[4:8], uint32(len(f.Payload)))
	header[8] = f.FrameType

	if _, err := w.Write(header[:]); err != nil {
		return fmt.Errorf("mux write header: %w", err)
	}

	if len(f.Payload) > 0 {
		if _, err := w.Write(f.Payload); err != nil {
			return fmt.Errorf("mux write payload: %w", err)
		}
	}

	return nil
}

func readFrame(r io.Reader) (*frame, error) {
	var header [headerSize]byte
	if _, err := io.ReadFull(r, header[:]); err != nil {
		return nil, fmt.Errorf("mux read header: %w", err)
	}

	f := &frame{
		StreamID:  binary.BigEndian.Uint32(header[0:4]),
		FrameType: header[8],
	}

	payloadLen := binary.BigEndian.Uint32(header[4:8])

	if payloadLen > 16*1024*1024 {
		return nil, fmt.Errorf("mux frame too large: %d bytes", payloadLen)
	}

	if payloadLen > 0 {
		f.Payload = make([]byte, payloadLen)
		if _, err := io.ReadFull(r, f.Payload); err != nil {
			return nil, fmt.Errorf("mux read payload: %w", err)
		}
	}

	return f, nil
}
