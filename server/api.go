package app

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/sugyan/shogi-dataset/common"
	"google.golang.org/appengine"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
)

type image struct {
	ID        string    `json:"id,omitempty"`
	ImageURL  string    `json:"image_url"`
	Label     string    `json:"label"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func init() {
	apiHandler := http.NewServeMux()
	apiHandler.HandleFunc("/index", apiIndexHandler)
	apiHandler.HandleFunc("/image/", apiImageHandler)
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

func apiImageHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)

	id := strings.TrimPrefix(r.URL.Path, "/image/")
	key, err := datastore.DecodeKey(id)
	if err != nil {
		log.Errorf(ctx, "failed to decode id: %s", err.Error())
		http.NotFound(w, r)
		return
	}
	switch r.Method {
	case "GET":
		err := getImage(ctx, key, w)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	case "DELETE":
		err := common.DeleteImage(ctx, key)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	default:
		log.Errorf(ctx, "method %s is not supported", r.Method)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
}

func getImage(ctx context.Context, key *datastore.Key, w http.ResponseWriter) error {
	result := &common.Image{}
	if err := datastore.Get(ctx, key, result); err != nil {
		log.Errorf(ctx, "failed to get image: %s", err.Error())
		return err
	}
	image := &image{
		ImageURL:  result.ImageURL,
		Label:     result.Label,
		CreatedAt: result.CreatedAt,
		UpdatedAt: result.UpdatedAt,
	}
	if err := json.NewEncoder(w).Encode(image); err != nil {
		log.Errorf(ctx, "failed to render json: %s", err.Error())
		return err
	}
	return nil
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

func fetchImages(ctx context.Context) ([]*image, error) {
	results := []*image{}
	iter := datastore.NewQuery(common.KindImage).Order("-UpdatedAt").Limit(20).Run(ctx)
	for {
		result := &common.Image{}
		key, err := iter.Next(result)
		if err == datastore.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		results = append(results, &image{
			ID:        key.Encode(),
			ImageURL:  result.ImageURL,
			Label:     result.Label,
			CreatedAt: result.CreatedAt,
			UpdatedAt: result.UpdatedAt,
		})
	}
	return results, nil
}
