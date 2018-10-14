package app

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/sugyan/shogi-dataset/common"
	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
)

func init() {
	apiHandler := http.NewServeMux()
	apiHandler.HandleFunc("/index", apiIndexHandler)
	apiHandler.HandleFunc("/upload", apiUploadHandler)
	http.Handle("/api/", http.StripPrefix("/api", apiHandler))
}

func apiIndexHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)

	results, err := fetchImages(ctx)
	if err != nil {
		log.Errorf(ctx, "failed to fetch images: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(results); err != nil {
		log.Errorf(ctx, "failed to render json: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func apiUploadHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)

	req := struct {
		Label string `json:"label"`
		Image string `json:"image"`
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Errorf(ctx, "failed to decode request body: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(req.Image, "data:image/jpeg;base64,"))
	if err != nil {
		log.Errorf(ctx, "failed to decode request image: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
	key, err := common.RegisterImage(ctx, data, req.Label)
	if err != nil {
		log.Errorf(ctx, "failed to store data: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
	log.Infof(ctx, "%v saved", key.Encode())

	w.WriteHeader(http.StatusOK)
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
