package app

import (
	// "encoding/base64"
	"context"
	"encoding/json"
	"log"
	"net/http"
	// "net/url"
	"strings"
	// "time"
	// "github.com/sugyan/shogi-dataset"
	// "google.golang.org/appengine/datastore"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset/web/entity"
)

type filter struct {
	filterStr string
	value     interface{}
}

func (app *App) apiIndexHandler(w http.ResponseWriter, r *http.Request) {
	total, err := app.entity.GetTotal(r.Context())
	if err != nil {
		log.Printf("failed to fetch total: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(total); err != nil {
		log.Printf("failed to render json: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (app *App) apiImageHandler(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/image/")
	key := datastore.NameKey(entity.KindImage, name, nil)
	// key, err := datastore.DecodeKey(id)
	// if err != nil {
	// 	log.Printf("failed to decode id: %s", err.Error())
	// 	http.NotFound(w, r)
	// 	return
	// }
	switch r.Method {
	case "GET":
		if err := app.getImage(r.Context(), key, w); err != nil {
			log.Printf("failed to get image: %s", err.Error())
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	// case "DELETE":
	// 	if err := deleteImage(ctx, key); err != nil {
	// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	// 		return
	// 	}
	// case "PUT":
	// 	if err := r.ParseForm(); err != nil {
	// 		log.Printf("failed to parse request form: %s", err.Error())
	// 		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
	// 		return
	// 	}
	// 	if err := editImage(ctx, key, r.Form.Get("label")); err != nil {
	// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	// 		return
	// 	}
	default:
		log.Printf("method %s is not supported", r.Method)
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}
}

func (app *App) getImage(ctx context.Context, key *datastore.Key, w http.ResponseWriter) error {
	image, err := app.entity.GetImage(ctx, key)
	if err != nil {
		return err
	}
	if err := json.NewEncoder(w).Encode(image); err != nil {
		return err
	}
	return nil
}

func (app *App) apiImagesHandler(w http.ResponseWriter, r *http.Request) {
	results, err := app.entity.FetchRecentImages(r.Context(), r.URL.Query())
	if err != nil {
		log.Printf("failed to fetch images: %v", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(results); err != nil {
		log.Printf("failed to render json: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

// func apiUploadHandler(w http.ResponseWriter, r *http.Request) {
// 	ctx := appengine.NewContext(r)

// 	req := struct {
// 		Label string `json:"label"`
// 		Image string `json:"image"`
// 	}{}
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		log.Printf("failed to decode request body: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
// 	}
// 	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(req.Image, "data:image/jpeg;base64,"))
// 	if err != nil {
// 		log.Printf("failed to decode request image: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
// 	}
// 	key, err := dataset.RegisterImage(ctx, data, req.Label)
// 	if err != nil {
// 		log.Printf("failed to store data: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
// 	}
// 	log.Printf("%v saved", key.Encode())

// 	w.WriteHeader(http.StatusOK)
// }
