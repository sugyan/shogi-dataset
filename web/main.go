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
	// setup app
	projectID := appengine.AppID(context.Background())
	isDev := appengine.IsDevAppServer()
	bucketName := fmt.Sprintf("%s.appspot.com", projectID)
	redirectURL := fmt.Sprintf("https://%s.appspot.com/oauth2/callback", projectID)
	if isDev {
		bucketName = "staging." + bucketName
		redirectURL = "http://localhost:8080/oauth2/callback"
	}
	app, err := app.NewApp(&app.Config{
		IsDev:              isDev,
		ProjectID:          projectID,
		BucketName:         bucketName,
		Oauth2ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		Oauth2ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		Oauth2RedirectURL:  redirectURL,
		CookieKey:          os.Getenv("COOKIE_KEY"),
	})
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
