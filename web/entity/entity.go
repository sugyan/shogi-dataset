package entity

import (
	"context"

	"cloud.google.com/go/datastore"
)

// constant values
const (
	KindImage = "Image"
	KindTotal = "Total"
)

// Client type
type Client struct {
	dsClient *datastore.Client
}

// NewClient function
func NewClient(projectID string) (*Client, error) {
	ctx := context.Background()
	dsClient, err := datastore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	return &Client{
		dsClient: dsClient,
	}, nil
}
