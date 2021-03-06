package entity

import (
	"context"

	"cloud.google.com/go/datastore"
	"cloud.google.com/go/storage"
	"github.com/gomodule/redigo/redis"
)

// Constant values
const (
	KindImage = "Image"
	KindTotal = "Total"
	KindUser  = "User"
	KindToken = "Token"
)

// Client type
type Client struct {
	redisPool    *redis.Pool
	dsClient     *datastore.Client
	csBucket     *storage.BucketHandle
	csBucketName string
}

// NewClient function
func NewClient(projectID, bucketName string, pool *redis.Pool) (*Client, error) {
	ctx := context.Background()
	// configure Cloud Datastore client
	dsClient, err := datastore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	// configure Cloud Storage bucket
	csClient, err := storage.NewClient(ctx)
	if err != nil {
		return nil, err
	}
	return &Client{
		redisPool:    pool,
		dsClient:     dsClient,
		csBucket:     csClient.Bucket(bucketName),
		csBucketName: bucketName,
	}, nil
}
