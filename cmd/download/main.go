package main

import (
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sync"

	"github.com/sugyan/shogi-dataset/web/entity"
)

const (
	targetTraining   = "training"
	targetValidation = "validation"
	targetTesting    = "testing"
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
	data        []byte
	label, name string
	err         error
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
	for _, target := range []string{targetTraining, targetValidation, targetTesting} {
		for _, label := range labels {
			err := os.MkdirAll(filepath.Join("data", target, label), os.ModePerm)
			if err != nil {
				log.Fatal(err)
			}
		}
	}

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
			b, err := hex.DecodeString(result.name)
			if err != nil {
				return err
			}
			var (
				targetPath string
				filename   = result.name + ".jpg"
				value      = binary.BigEndian.Uint64(b) % 100
			)
			if value < 80 {
				targetPath = filepath.Join("data", targetTraining, result.label, filename)
			} else if value < 90 {
				targetPath = filepath.Join("data", targetValidation, result.label, filename)
			} else {
				targetPath = filepath.Join("data", targetTesting, result.label, filename)
			}
			file, err := os.Create(targetPath)
			if err != nil {
				return err
			}
			if _, err := file.Write(result.data); err != nil {
				return err
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
			if resp.StatusCode/100 != 2 {
				log.Fatal(resp.Status)
			}

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
		data, err := download(image)
		if err != nil {
			resultCh <- &result{err: err}
			break
		} else {
			resultCh <- &result{data: data, label: image.Label, name: path.Base(image.ImageURL)}
		}
	}
}

func download(image *entity.ImageResult) ([]byte, error) {
	log.Printf("download %s", image.ImageURL)
	resp, err := http.Get(image.ImageURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return ioutil.ReadAll((resp.Body))
}
