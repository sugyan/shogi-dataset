package common

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"cloud.google.com/go/storage"
	"google.golang.org/appengine/file"
)

const urlFormat = "https://storage.googleapis.com/%s/%s"

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
	return fmt.Sprintf(urlFormat, bucketName, fileName), nil
}

// DeleteObject function
func DeleteObject(ctx context.Context, fileName string) error {
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
