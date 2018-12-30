package entity

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/url"
	"time"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	"google.golang.org/api/iterator"
)

// Image type
type Image struct {
	ImageURL  string
	Label     string
	UserID    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

const (
	urlFormat    = "https://storage.googleapis.com/%s/%s"
	defaultLimit = 30
)

// ImageResult struct
type ImageResult struct {
	ID        string    `json:"id,omitempty"`
	ImageURL  string    `json:"image_url"`
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ImagesResult struct
type ImagesResult struct {
	Images []*ImageResult `json:"images"`
	Cursor string         `json:"cursor"`
}

// GetImage method
func (c *Client) GetImage(ctx context.Context, key *datastore.Key) (*ImageResult, error) {
	result := &Image{}
	if err := c.dsClient.Get(ctx, key, result); err != nil {
		return nil, err
	}
	return &ImageResult{
		ID:        key.Name,
		ImageURL:  result.ImageURL,
		Label:     result.Label,
		CreatedAt: result.CreatedAt,
		UpdatedAt: result.UpdatedAt,
	}, nil
}

// FetchRecentImages method
func (c *Client) FetchRecentImages(ctx context.Context, params url.Values) (*ImagesResult, error) {
	query := datastore.NewQuery(KindImage)
	{
		label := params.Get("label")
		if label != "" {
			query = query.Filter("Label =", label)
		}
		cursor := params.Get("cursor")
		if cursor != "" {
			c, err := datastore.DecodeCursor(cursor)
			if err != nil {
				return nil, err
			}
			query = query.Start(c)
		}
		query = query.Order("-UpdatedAt").Limit(defaultLimit)
	}

	images := make([]*ImageResult, 0, defaultLimit)
	iter := c.dsClient.Run(ctx, query)
	for {
		result := &Image{}
		key, err := iter.Next(result)
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		images = append(images, &ImageResult{
			ID:        key.Name,
			ImageURL:  result.ImageURL,
			Label:     result.Label,
			CreatedAt: result.CreatedAt,
			UpdatedAt: result.UpdatedAt,
		})
	}
	cursor, err := iter.Cursor()
	if err != nil {
		return nil, err
	}
	results := &ImagesResult{
		Images: images,
		Cursor: cursor.String(),
	}
	if len(images) < defaultLimit {
		results.Cursor = ""
	}
	return results, nil
}

// SaveImage method
func (c *Client) SaveImage(ctx context.Context, imageData []byte, label string) (*datastore.Key, error) {
	// calculate digest
	hash := md5.New()
	hash.Write(imageData)
	digest := hex.EncodeToString(hash.Sum(nil))

	// update or create entity
	created := false
	key := datastore.NameKey(KindImage, digest, nil)
	image := &Image{}
	if err := c.dsClient.Get(ctx, key, image); err != nil {
		if err == datastore.ErrNoSuchEntity {
			created = true
			image.CreatedAt = time.Now()
		} else {
			return nil, err
		}
	}
	// upload to Cloud Storage
	imageURL, err := c.storeObject(ctx, digest, imageData)
	if err != nil {
		return nil, err
	}
	log.Printf("stored image: %s", imageURL)
	// u := user.Current(ctx)
	// if u != nil {
	// 	image.UserID = u.ID
	// }
	image.ImageURL = imageURL
	image.Label = label
	image.UpdatedAt = time.Now()
	if _, err := c.dsClient.Put(ctx, key, image); err != nil {
		return nil, err
	}
	log.Printf("stored entity: %s", key.Name)

	// update total count
	if created {
		if err := c.updateTotal(ctx, &totalUpdate{label, totalIncr}); err != nil {
			return nil, err
		}
	}
	return key, nil
}

// DeleteImage method
func (c *Client) DeleteImage(ctx context.Context, key *datastore.Key) error {
	// get entity for getting label name
	image := &Image{}
	if err := c.dsClient.Get(ctx, key, image); err != nil {
		return err
	}
	// delete entity
	if err := c.dsClient.Delete(ctx, key); err != nil {
		return err
	}
	// update total count
	if err := c.updateTotal(ctx, &totalUpdate{image.Label, totalDecr}); err != nil {
		return err
	}
	// delete object from Cloud Storage
	if err := c.deleteObject(ctx, key.Name); err != nil {
		return err
	}
	return nil
}

// UpdateImage method
func (c *Client) UpdateImage(ctx context.Context, key *datastore.Key, nextLabel string) error {
	var prevLabel string
	image := &Image{}
	if err := c.dsClient.Get(ctx, key, image); err != nil {
		return err
	}
	prevLabel = image.Label
	if prevLabel == nextLabel {
		return nil
	}
	// set new label
	image.Label = nextLabel
	image.UpdatedAt = time.Now()
	if _, err := c.dsClient.Put(ctx, key, image); err != nil {
		return err
	}
	updates := []*totalUpdate{
		{prevLabel, totalDecr},
		{nextLabel, totalIncr},
	}
	if err := c.updateTotal(ctx, updates...); err != nil {
		return err
	}
	return nil
}

func (c *Client) storeObject(ctx context.Context, fileName string, data []byte) (string, error) {
	w := c.csBucket.Object(fileName).NewWriter(ctx)
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
	return fmt.Sprintf(urlFormat, c.csBucketName, fileName), nil
}

func (c *Client) deleteObject(ctx context.Context, fileName string) error {
	return c.csBucket.Object(fileName).Delete(ctx)
}
