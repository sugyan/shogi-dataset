package common

import (
	"context"
	"time"

	"google.golang.org/appengine/datastore"
)

// constant values
const (
	KindImage = "Image"
)

// Image type
type Image struct {
	ImageURL  string
	Piece     string
	CreatedAt time.Time
}

// RegisterImage function
func RegisterImage(ctx context.Context, imageURL, piece string) error {
	// TODO: upload image
	image := &Image{
		ImageURL:  imageURL,
		Piece:     piece,
		CreatedAt: time.Now(),
	}
	key := datastore.NewIncompleteKey(ctx, KindImage, nil)
	key, err := datastore.Put(ctx, key, image)
	if err != nil {
		return err
	}
	return nil
}
