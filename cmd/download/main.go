package main

import (
	"context"
	"flag"
	"log"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset/common"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/iterator"
	"google.golang.org/appengine/remote_api"
)

var (
	host      string
	projectID string
)

func init() {
	flag.StringVar(&host, "host", "localhost:8080", "hostname of Remote API")
	flag.StringVar(&projectID, "projectID", "local", "project ID")
}

func main() {
	flag.Parse()
	if err := download(); err != nil {
		log.Fatal(err)
	}
}

func download() error {
	client, err := google.DefaultClient(context.Background(),
		"https://www.googleapis.com/auth/appengine.apis",
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/cloud-platform",
	)
	if err != nil {
		return err
	}
	ctx, err := remote_api.NewRemoteContext(host, client)
	if err != nil {
		return err
	}

	dsClient, err := datastore.NewClient(ctx, projectID)
	if err != nil {
		return err
	}
	query := datastore.NewQuery(common.KindImage)
	iter := dsClient.Run(ctx, query)
	for {
		var image common.Image
		_, err := iter.Next(&image)
		if err == iterator.Done {
			break
		}
		if err != nil {
			return err
		}
		log.Printf("image: %v", image)
	}
	return nil
}
