package common

import (
	"bytes"
	"context"
	"encoding/hex"
	"fmt"
	"io"
	"time"

	"cloud.google.com/go/storage"
	"crypto/md5"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/file"
	"google.golang.org/appengine/log"
)

// constant values
const (
	KindImage = "Image"
)

// Image type
type Image struct {
	ImageURL  string    `json:"imageUrl"`
	Piece     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// RegisterImage function
func RegisterImage(ctx context.Context, imageData []byte, piece string) (*datastore.Key, error) {
	hash := md5.New()
	hash.Write(imageData)
	digest := hex.EncodeToString(hash.Sum(nil))

	key := datastore.NewKey(ctx, KindImage, digest, 0, nil)
	image := &Image{}
	if err := datastore.Get(ctx, key, image); err != nil {
		if err == datastore.ErrNoSuchEntity {
			image.CreatedAt = time.Now()
		} else {
			return nil, err
		}
	}

	imageURL, err := storeImage(ctx, digest, imageData)
	if err != nil {
		return nil, err
	}
	log.Infof(ctx, "stored image: %s", imageURL)
	image.ImageURL = imageURL
	image.Piece = piece
	image.UpdatedAt = time.Now()
	key, err = datastore.Put(ctx, key, image)
	if err != nil {
		return nil, err
	}
	log.Infof(ctx, "stored entity: %s", key.Encode())
	return key, nil
}

func storeImage(ctx context.Context, fileName string, data []byte) (string, error) {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return "", err
	}
	defer client.Close()

	bucketName, err := file.DefaultBucketName(ctx)
	if err != nil {
		return "", err
	}
	w := client.Bucket(bucketName).Object(fileName).NewWriter(ctx)
	w.ACL = []storage.ACLRule{
		{
			Entity: storage.AllUsers,
			Role:   storage.RoleReader,
		},
	}
	r := bytes.NewReader(data)
	if _, err := io.Copy(w, r); err != nil {
		return "", err
	}
	if err := w.Close(); err != nil {
		return "", err
	}
	return fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, fileName), nil
}
