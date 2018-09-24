package main

import (
	"context"
	"flag"
	"io/ioutil"
	"log"

	"github.com/sugyan/shogi-dataset/common"
	"golang.org/x/oauth2/google"
	"google.golang.org/appengine/remote_api"
)

var (
	host  string
	file  string
	label string
)

func init() {
	flag.StringVar(&host, "host", "localhost:8080", "hostname of Remote API")
	flag.StringVar(&file, "file", "./example.jpg", "filename to upload")
	flag.StringVar(&label, "label", "", "label name of image")
}

func main() {
	flag.Parse()
	if label == "" {
		log.Fatal("label is empty")
	}

	data, err := ioutil.ReadFile(file)
	if err != nil {
		log.Fatal(err)
	}
	client, err := google.DefaultClient(context.Background(),
		"https://www.googleapis.com/auth/appengine.apis",
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/cloud-platform",
	)
	if err != nil {
		log.Fatal(err)
	}
	ctx, err := remote_api.NewRemoteContext(host, client)
	if err != nil {
		log.Fatal(err)
	}

	key, err := common.RegisterImage(ctx, data, label)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("%v saved", key.Encode())
}
