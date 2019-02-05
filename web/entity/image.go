package entity

import (
	"bytes"
	"context"
	"crypto/md5"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/url"
	"strconv"
	"time"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	"github.com/gomodule/redigo/redis"
	"google.golang.org/api/iterator"
)

// Image type
type Image struct {
	ImageURL  string
	Label     string
	User      *datastore.Key
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
	User      string    `json:"user,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ImagesResult struct
type ImagesResult struct {
	Images []*ImageResult `json:"images"`
	Cursor string         `json:"cursor"`
}

// FetchImage method
func (c *Client) FetchImage(ctx context.Context, key *datastore.Key) (*ImageResult, error) {
	result := &Image{}
	if err := c.dsClient.Get(ctx, key, result); err != nil {
		return nil, err
	}
	user, err := c.FetchUser(ctx, result.User.ID)
	if err != nil {
		return nil, err
	}
	return &ImageResult{
		ID:        key.Name,
		ImageURL:  result.ImageURL,
		Label:     result.Label,
		User:      user.Name,
		CreatedAt: result.CreatedAt,
		UpdatedAt: result.UpdatedAt,
	}, nil
}

// FetchImages method
func (c *Client) FetchImages(ctx context.Context, params url.Values) (*ImagesResult, error) {
	query, limit, err := c.fetchImagesQuery(params)
	if err != nil {
		return nil, err
	}

	images := make([]*ImageResult, 0, limit)
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
	}
	if len(images) >= limit {
		data := cursor.String()
		hash := sha1.New()
		if _, err := hash.Write([]byte(data)); err != nil {
			return nil, err
		}
		checksum := hash.Sum(nil)
		key := hex.EncodeToString(checksum[:])
		conn := c.redisPool.Get()
		defer conn.Close()
		if _, err := conn.Do("SET", key, data); err != nil {
			return nil, err
		}
		results.Cursor = key
	}
	return results, nil
}

func (c *Client) fetchImagesQuery(params url.Values) (*datastore.Query, int, error) {
	query := datastore.NewQuery(KindImage)
	// label
	label := params.Get("label")
	if label != "" {
		query = query.Filter("Label =", label)
	}
	// cursor
	cursor := params.Get("cursor")
	if cursor != "" {
		conn := c.redisPool.Get()
		defer conn.Close()
		reply, err := redis.String(conn.Do("GET", cursor))
		if err != nil {
			if err != redis.ErrNil {
				return nil, 0, err
			}
		} else {
			c, err := datastore.DecodeCursor(reply)
			if err != nil {
				return nil, 0, err
			}
			query = query.Start(c)
		}
	}
	// limit
	limit := defaultLimit
	count := params.Get("count")
	if count != "" {
		i64, err := strconv.Atoi(count)
		if err != nil {
			return nil, 0, err
		}
		limit = i64
	}
	return query.Order("-UpdatedAt").Limit(limit), limit, nil
}

// SaveImage method
func (c *Client) SaveImage(ctx context.Context, imageData []byte, label string, userID int64) (*datastore.Key, error) {
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
			image.User = datastore.IDKey(KindUser, userID, nil)
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

	image.ImageURL = imageURL
	image.Label = label
	image.UpdatedAt = time.Now()
	if _, err := c.dsClient.Put(ctx, key, image); err != nil {
		return nil, err
	}

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
	// delete object from Cloud Storage
	if err := c.csBucket.Object(key.Name).Delete(ctx); err != nil {
		if err != storage.ErrObjectNotExist {
			return err
		}
		log.Println(err.Error())
	}
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
