package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/sugyan/shogi-dataset/web/app"
)

func main() {
	isDev := os.Getenv("MODE") == "development"
	// setup app
	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	if projectID == "" {
		var err error
		projectID, err = getProjectID()
		if err != nil {
			log.Fatal(err)
		}
	}
	bucketName := fmt.Sprintf("%s.appspot.com", projectID)
	redirectURL := fmt.Sprintf("https://%s.appspot.com/auth/callback", projectID)
	if isDev {
		bucketName = "staging." + bucketName
		redirectURL = "http://localhost:3000/auth/callback"
	}
	app, err := app.NewApp(&app.Config{
		IsDev:              isDev,
		ProjectID:          projectID,
		BucketName:         bucketName,
		Oauth2ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		Oauth2ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		Oauth2RedirectURL:  redirectURL,
		CookieKey:          os.Getenv("COOKIE_KEY"),
		RedisURL:           os.Getenv("REDIS_URL"),
		RedisPassword:      os.Getenv("REDIS_PASSWORD"),
	})
	if err != nil {
		log.Fatal(err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Listening on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), app.Handler()); err != nil {
		log.Fatal(err)
	}
}

func getProjectID() (string, error) {
	resp, err := http.Get("http://metadata/computeMetadata/v1/project/project-id")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
