package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/sugyan/shogi-dataset/web/app"
	"google.golang.org/appengine"
)

func main() {
	projectID := appengine.AppID(context.Background())
	isDev := appengine.IsDevAppServer()
	bucketName := fmt.Sprintf("%s.appspot.com")
	if isDev {
		bucketName += "staging." + bucketName
	}

	app, err := app.NewApp(projectID, bucketName, isDev)
	if err != nil {
		log.Fatal(err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), app.Handler()); err != nil {
		log.Fatal(err)
	}
}
