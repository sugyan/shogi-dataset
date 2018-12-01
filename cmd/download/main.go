package main

import (
	"context"
	"crypto/md5"
	"encoding/binary"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
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
	uid  uint64
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

	// write labels data
	if err := writeLabels(); err != nil {
		log.Fatal(err)
	}

	// get images
	imagesCh, err := getImages()
	if err != nil {
		log.Fatal(err)
	}

	// download and encode data
	resultCh := make(chan *result)
	wg := sync.WaitGroup{}
	for i := 0; i < 20; i++ {
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

	// write to files
	if err := write(resultCh); err != nil {
		log.Fatal(err)
	}
}

func writeLabels() error {
	file, err := os.Create(filepath.Join("data", "labels.txt"))
	if err != nil {
		return err
	}
	for _, label := range labels {
		if _, err := file.WriteString(label + "\n"); err != nil {
			return err
		}
	}
	return nil
}

func write(resultCh <-chan *result) error {
	t, err := os.Create(filepath.Join("data", "train.tfrecord"))
	if err != nil {
		return err
	}
	defer t.Close()
	v, err := os.Create(filepath.Join("data", "valid.tfrecord"))
	if err != nil {
		return err
	}
	defer v.Close()
loop:
	for {
		select {
		case result, ok := <-resultCh:
			if !ok {
				break loop
			}
			if result.err != nil {
				return err
			}
			if result.uid%100 < 90 {
				log.Printf("write to train.tfrecord (%v bytes)", len(result.data))
				if _, err := t.Write(result.data); err != nil {
					return err
				}
			} else {
				log.Printf("write to valid.tfrecord (%v bytes)", len(result.data))
				if _, err := v.Write(result.data); err != nil {
					return err
				}
			}
		}
	}
	return nil
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
			hash := md5.New()
			hash.Write([]byte(image.ImageURL))
			uid := binary.BigEndian.Uint64(hash.Sum(nil))
			resultCh <- &result{uid: uid, data: data}
		}
	}
}

func encode(image *dataset.Image) ([]byte, error) {
	log.Printf("download %s", image.ImageURL)
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
