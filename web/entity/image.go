package entity

import (
	"context"
	"net/url"
	"time"

	"cloud.google.com/go/datastore"
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

const defaultLimit = 30

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
