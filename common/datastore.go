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
	"google.golang.org/appengine/user"
)

// constant values
const (
	KindImage = "Image"
	KindTotal = "Total"
)

// Image type
type Image struct {
	ImageURL  string
	Label     string
	UserID    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Total type
type Total struct {
	BLANK int `json:"BLANK"`
	BFU   int `json:"B_FU"`
	WFU   int `json:"W_FU"`
	BTO   int `json:"B_TO"`
	WTO   int `json:"W_TO"`
	BKY   int `json:"B_KY"`
	WKY   int `json:"W_KY"`
	BNY   int `json:"B_NY"`
	WNY   int `json:"W_NY"`
	BKE   int `json:"B_KE"`
	WKE   int `json:"W_KE"`
	BNK   int `json:"B_NK"`
	WNK   int `json:"W_NK"`
	BGI   int `json:"B_GI"`
	WGI   int `json:"W_GI"`
	BNG   int `json:"B_NG"`
	WNG   int `json:"W_NG"`
	BKI   int `json:"B_KI"`
	WKI   int `json:"W_KI"`
	BKA   int `json:"B_KA"`
	WKA   int `json:"W_KA"`
	BUM   int `json:"B_UM"`
	WUM   int `json:"W_UM"`
	BHI   int `json:"B_HI"`
	WHI   int `json:"W_HI"`
	BRY   int `json:"B_RY"`
	WRY   int `json:"W_RY"`
	BOU   int `json:"B_OU"`
	WOU   int `json:"W_OU"`
}

// RegisterImage function
func RegisterImage(ctx context.Context, imageData []byte, label string) (*datastore.Key, error) {
	hash := md5.New()
	hash.Write(imageData)
	digest := hex.EncodeToString(hash.Sum(nil))

	key := datastore.NewKey(ctx, KindImage, digest, 0, nil)
	image := &Image{}
	if err := datastore.Get(ctx, key, image); err != nil {
		if err == datastore.ErrNoSuchEntity {
			image.CreatedAt = time.Now()
		} else {
			log.Errorf(ctx, "failed to get image entity")
			return nil, err
		}
	}

	imageURL, err := storeObject(ctx, digest, imageData)
	if err != nil {
		return nil, err
	}
	log.Infof(ctx, "stored image: %s", imageURL)
	u := user.Current(ctx)
	if u != nil {
		image.UserID = u.ID
	}
	image.ImageURL = imageURL
	image.Label = label
	image.UpdatedAt = time.Now()
	key, err = datastore.Put(ctx, key, image)
	if err != nil {
		log.Errorf(ctx, "failed to put image entity")
		return nil, err
	}
	log.Infof(ctx, "stored entity: %s", key.Encode())
	return key, nil
}

// DeleteImage function
func DeleteImage(ctx context.Context, key *datastore.Key) error {
	log.Infof(ctx, "key: %v", key.StringID())
	if err := deleteObject(ctx, key.StringID()); err != nil {
		log.Errorf(ctx, "failed to delete object: %s", err.Error())
		return err
	}
	if err := datastore.Delete(ctx, key); err != nil {
		log.Errorf(ctx, "failed to delete entity: %s", err.Error())
		return err
	}
	return nil
}

func storeObject(ctx context.Context, fileName string, data []byte) (string, error) {
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

func deleteObject(ctx context.Context, fileName string) error {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	bucketName, err := file.DefaultBucketName(ctx)
	if err != nil {
		return err
	}
	if err := client.Bucket(bucketName).Object(fileName).Delete(ctx); err != nil {
		return err
	}
	return nil
}

// GetTotal function
func GetTotal(ctx context.Context) (*Total, error) {
	total := &Total{}
	key := datastore.NewKey(ctx, KindTotal, "", 1, nil)
	if err := datastore.Get(ctx, key, total); err != nil {
		if err == datastore.ErrNoSuchEntity {
			if _, err := datastore.Put(ctx, key, total); err != nil {
				log.Infof(ctx, "failed to put entity: %s", err.Error())
				return nil, err
			}
		} else {
			log.Infof(ctx, "failed to get entity: %s", err.Error())
			return nil, err
		}
	}
	return total, nil
}
