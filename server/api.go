package app

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/sugyan/shogi-dataset/common"
	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
)

func init() {
	apiHandler := http.NewServeMux()
	apiHandler.HandleFunc("/index", apiIndexHandler)
	http.Handle("/api/", http.StripPrefix("/api", apiHandler))
}

func apiIndexHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)

	results, err := fetchImages(ctx)
	if err != nil {
		log.Errorf(ctx, "failed to fetch images: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
	if err := json.NewEncoder(w).Encode(results); err != nil {
		log.Errorf(ctx, "failed to render json: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func fetchImages(ctx context.Context) ([]*common.Image, error) {
	results := []*common.Image{}
	iter := datastore.NewQuery(common.KindImage).Order("-UpdatedAt").Run(ctx)
	for {
		image := &common.Image{}
		_, err := iter.Next(image)
		if err == datastore.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		results = append(results, image)
	}
	return results, nil
}
