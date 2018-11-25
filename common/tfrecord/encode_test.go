package tfrecord_test

import (
	"bytes"
	"testing"

	"github.com/sugyan/shogi-dataset/common/tfrecord"
	"github.com/tensorflow/tensorflow/tensorflow/go/core/example"
)

func TestEmptyExample(t *testing.T) {
	e := &example.Example{}
	result, err := tfrecord.Marshal(e)
	if err != nil {
		t.Fatal(err)
	}
	expected := []byte{
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x29, 0x03, 0x98, 0x07, 0xd8, 0xea, 0x82, 0xa2,
	}
	if !bytes.Equal(result, expected) {
		t.Errorf("%v is not equal to %v", result, expected)
	}
}
