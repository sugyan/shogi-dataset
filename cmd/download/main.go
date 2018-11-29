package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"sync"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset"
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
	images, err := getImages()
	if err != nil {
		log.Fatal(err)
	}

	wg := sync.WaitGroup{}
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			download(images)
		}()
	}
	wg.Wait()
}

func getImages() (<-chan *dataset.Image, error) {
	client, err := google.DefaultClient(context.Background(),
		"https://www.googleapis.com/auth/appengine.apis",
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/cloud-platform",
	)
	if err != nil {
		return nil, err
	}
	ctx, err := remote_api.NewRemoteContext(host, client)
	if err != nil {
		return nil, err
	}

	dsClient, err := datastore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	ch := make(chan *dataset.Image)
	go func() {
		defer close(ch)
		query := datastore.NewQuery(dataset.KindImage)
		// TODO
		query = query.Limit(30)
		iter := dsClient.Run(ctx, query)
		for {
			var image dataset.Image
			_, err := iter.Next(&image)
			if err == iterator.Done {
				break
			}
			if err != nil {
				log.Fatal(err)
			}
			ch <- &image
		}
	}()
	return ch, nil
}

func download(in <-chan *dataset.Image) {
	for image := range in {
		log.Printf("image: %v", image)
		resp, err := http.Get(image.ImageURL)
		if err != nil {
			log.Fatal(err)
		}
		defer resp.Body.Close()

		// TODO
	}
}
