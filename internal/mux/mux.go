package mux

import (
	"encoding/binary"
	"fmt"
	"io"
	"sync"
)

const headerSize = 9

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

var writeBufPool = sync.Pool{
	New: func() any {
		b := make([]byte, 32*1024)
		return &b
	},
}

func writeFrame(w io.Writer, f *frame) error {
	payloadLen := len(f.Payload)
	totalLen := headerSize + payloadLen

	if payloadLen == 0 {
		var header [headerSize]byte
		binary.BigEndian.PutUint32(header[0:4], f.StreamID)
		binary.BigEndian.PutUint32(header[4:8], 0)
		header[8] = f.FrameType
		if _, err := w.Write(header[:]); err != nil {
			return fmt.Errorf("mux write header: %w", err)
		}
		return nil
	}

	var buf []byte
	var bufPtr *[]byte
	if totalLen <= 32*1024 {
		bufPtr = writeBufPool.Get().(*[]byte)
		buf = (*bufPtr)[:totalLen]
		defer writeBufPool.Put(bufPtr)
	} else {
		buf = make([]byte, totalLen)
	}

	binary.BigEndian.PutUint32(buf[0:4], f.StreamID)
	binary.BigEndian.PutUint32(buf[4:8], uint32(payloadLen))
	buf[8] = f.FrameType
	copy(buf[headerSize:], f.Payload)

	if _, err := w.Write(buf); err != nil {
		return fmt.Errorf("mux write frame: %w", err)
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
