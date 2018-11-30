package main

import (
	"context"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"sync"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset"
	"github.com/sugyan/shogi-dataset/tfrecord"
	"github.com/tensorflow/tensorflow/tensorflow/go/core/example"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/iterator"
	"google.golang.org/appengine/remote_api"
)

var (
	host      string
	projectID string
)

var (
	labels = []string{
		"BLANK",
		"B_FU",
		"B_KY",
		"B_KE",
		"B_GI",
		"B_KI",
		"B_KA",
		"B_HI",
		"B_OU",
		"B_TO",
		"B_NY",
		"B_NK",
		"B_NG",
		"B_UM",
		"B_RY",
		"W_FU",
		"W_KY",
		"W_KE",
		"W_GI",
		"W_KI",
		"W_KA",
		"W_HI",
		"W_OU",
		"W_TO",
		"W_NY",
		"W_NK",
		"W_NG",
		"W_UM",
		"W_RY",
	}
	labelIDMap = map[string]int64{}
)

type result struct {
	data []byte
	err  error
}

func init() {
	flag.StringVar(&host, "host", "localhost:8080", "hostname of Remote API")
	flag.StringVar(&projectID, "projectID", "local", "project ID")

	for i, label := range labels {
		labelIDMap[label] = int64(i)
	}
}

func main() {
	flag.Parse()

	imagesCh, err := getImages()
	if err != nil {
		log.Fatal(err)
	}

	resultCh := make(chan *result)
	wg := sync.WaitGroup{}
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			worker(imagesCh, resultCh)
		}()
	}

	go func() {
		wg.Wait()
		close(resultCh)
	}()
loop:
	for {
		select {
		case result, ok := <-resultCh:
			if !ok {
				break loop
			}
			if result.err != nil {
				log.Fatal(result.err)
			}
			// TODO
			log.Printf("%v", len(result.data))
		}
	}
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

func worker(imagesCh <-chan *dataset.Image, resultCh chan<- *result) {
	for image := range imagesCh {
		data, err := encode(image)
		if err != nil {
			resultCh <- &result{err: err}
			break
		} else {
			resultCh <- &result{data: data}
		}
	}
}

func encode(image *dataset.Image) ([]byte, error) {
	resp, err := http.Get(image.ImageURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	e := &example.Example{
		Features: &example.Features{
			Feature: map[string]*example.Feature{
				"image": {
					Kind: &example.Feature_BytesList{
						BytesList: &example.BytesList{
							Value: [][]byte{data},
						},
					},
				},
				"label": {
					Kind: &example.Feature_Int64List{
						Int64List: &example.Int64List{
							Value: []int64{labelIDMap[image.Label]},
						},
					},
				},
			},
		},
	}
	return tfrecord.Marshal(e)
}
