package tfrecord

import (
	"bytes"
	"encoding/binary"
	"hash/crc32"

	"github.com/golang/protobuf/proto"
	"github.com/tensorflow/tensorflow/tensorflow/go/core/example"
)

type encoder struct {
	table *crc32.Table
}

func newEncoder() *encoder {
	return &encoder{
		table: crc32.MakeTable(crc32.Castagnoli),
	}
}

// Marshal function
func Marshal(e *example.Example) ([]byte, error) {
	b, err := proto.Marshal(e)
	if err != nil {
		return nil, err
	}
	return newEncoder().encode(b)
}

func (e *encoder) encode(b []byte) ([]byte, error) {
	l := make([]byte, 8)
	binary.LittleEndian.PutUint64(l, uint64(len(b)))
	lcrc := maskCrc32(crc32.Checksum(l, e.table))
	bcrc := maskCrc32(crc32.Checksum(b, e.table))

	buf := bytes.NewBuffer(nil)
	binary.Write(buf, binary.LittleEndian, l)
	binary.Write(buf, binary.LittleEndian, lcrc)
	if _, err := buf.Write(b); err != nil {
		return nil, err
	}
	binary.Write(buf, binary.LittleEndian, bcrc)
	return buf.Bytes(), nil
}

func maskCrc32(crc uint32) uint32 {
	return ((crc >> 15) | (crc << 17)) + 0xa282ead8
}
