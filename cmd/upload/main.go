package main

import (
	"context"
	"flag"
	"io/ioutil"
	"log"
	"path/filepath"

	"github.com/sugyan/shogi-dataset"
	"golang.org/x/oauth2/google"
	"google.golang.org/appengine/remote_api"
)

var (
	host  string
	file  string
	dir   string
	label string
)

func init() {
	flag.StringVar(&host, "host", "localhost:8080", "hostname of Remote API")
	flag.StringVar(&file, "file", "./example.jpg", "filename to upload")
	flag.StringVar(&dir, "dir", "", "search directory for uploading")
	flag.StringVar(&label, "label", "", "label name of image")
}

func main() {
	flag.Parse()
	if label == "" {
		log.Fatal("label is empty")
	}

	files := []string{}
	if dir != "" {
		matches, err := filepath.Glob(filepath.Join(dir, "*.jpg"))
		if err != nil {
			log.Fatal(err)
		}
		for _, match := range matches {
			files = append(files, match)
		}
	} else {
		files = append(files, file)
	}
	if err := upload(files, label); err != nil {
		log.Fatal(err)
	}
}

func upload(files []string, label string) error {
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

	for _, file := range files {
		data, err := ioutil.ReadFile(file)
		if err != nil {
			return err
		}
		key, err := dataset.RegisterImage(ctx, data, label)
		if err != nil {
			return err
		}
		log.Printf("%v saved", key.Encode())
	}
	return nil
}
