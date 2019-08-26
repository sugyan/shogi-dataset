package main

import (
	"crypto/md5"
	"encoding/binary"
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sync"

	"github.com/sugyan/shogi-dataset/tfrecord"
	"github.com/sugyan/shogi-dataset/web/entity"
	"github.com/tensorflow/tensorflow/tensorflow/go/core/example"
)

var (
	host  string
	token string
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
	flag.StringVar(&host, "host", "http://localhost:8080", "hostname of API endpoint")
	flag.StringVar(&token, "token", "", "token for APIs")

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
	training, err := os.Create(filepath.Join("data", "training.tfrecord"))
	if err != nil {
		return err
	}
	defer training.Close()
	validation, err := os.Create(filepath.Join("data", "validation.tfrecord"))
	if err != nil {
		return err
	}
	defer validation.Close()
	testing, err := os.Create(filepath.Join("data", "testing.tfrecord"))
	if err != nil {
		return err
	}
	defer testing.Close()
loop:
	for {
		select {
		case result, ok := <-resultCh:
			if !ok {
				break loop
			}
			if result.err != nil {
				return result.err
			}
			value := result.uid % 100
			if value < 80 {
				log.Printf("write to training.tfrecord (%v bytes)", len(result.data))
				if _, err := training.Write(result.data); err != nil {
					return err
				}
			} else if value < 90 {
				log.Printf("write to validation.tfrecord (%v bytes)", len(result.data))
				if _, err := validation.Write(result.data); err != nil {
					return err
				}
			} else {
				log.Printf("write to testing.tfrecord (%v bytes)", len(result.data))
				if _, err := testing.Write(result.data); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func getImages() (<-chan *entity.ImageResult, error) {
	u, err := url.ParseRequestURI(host + "/api/images")
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	ch := make(chan *entity.ImageResult)
	go func() {
		q := url.Values{}
		q.Set("count", "200")
		defer close(ch)
		for {
			req.URL.RawQuery = q.Encode()
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				log.Fatal(err)
			}
			defer resp.Body.Close()

			results := &entity.ImagesResult{}
			if err := json.NewDecoder(resp.Body).Decode(results); err != nil {
				log.Fatal(err)
			}
			for _, imageResult := range results.Images {
				ch <- imageResult
			}
			if results.Cursor == "" {
				break
			}
			q.Set("cursor", results.Cursor)
		}
	}()
	return ch, nil
}

func worker(imagesCh <-chan *entity.ImageResult, resultCh chan<- *result) {
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

func encode(image *entity.ImageResult) ([]byte, error) {
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
