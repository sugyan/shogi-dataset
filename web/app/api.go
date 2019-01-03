package app

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset/web/entity"
)

type filter struct {
	filterStr string
	value     interface{}
}

var errForbidden = fmt.Errorf("editing is forbidden")

func (app *App) apiUserHandler(w http.ResponseWriter, r *http.Request) {
	result := struct {
		Name string `json:"name,omitempty"`
		Role string `json:"role,omitempty"`
	}{}
	u := app.currentUser(r.Context())
	if u != nil {
		user, err := app.entity.GetUser(r.Context(), u.ID)
		if err != nil {
			log.Printf("failed to get user: %s", err.Error())
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		result.Name = user.Name
		result.Role = string(user.Role)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Printf("failed to encode json: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
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
	if err := func(method string) error {
		ctx := r.Context()
		switch method {
		case "GET":
			image, err := app.entity.GetImage(ctx, key)
			if err != nil {
				return err
			}
			if err := json.NewEncoder(w).Encode(image); err != nil {
				return err
			}
		case "DELETE":
			user := app.currentUser(ctx)
			if user != nil && user.canEdit() {
				if err := app.entity.DeleteImage(ctx, key); err != nil {
					return err
				}
			} else {
				return errForbidden
			}
		case "PUT":
			user := app.currentUser(ctx)
			if user != nil && user.canEdit() {
				if err := r.ParseForm(); err != nil {
					return err
				}
				if err := app.entity.UpdateImage(ctx, key, r.Form.Get("label")); err != nil {
					return err
				}
			} else {
				return errForbidden
			}
		default:
			return fmt.Errorf("method %s is not supported", method)
		}
		return nil
	}(r.Method); err != nil {
		if err == errForbidden {
			http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		} else {
			log.Printf("failed to do %s image: %s", r.Method, err.Error())
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
	}
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

func (app *App) apiUploadHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := app.currentUser(ctx)
	if !(user != nil && user.canEdit()) {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}
	req := struct {
		Label string `json:"label"`
		Image string `json:"image"`
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("failed to decode request body: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(req.Image, "data:image/jpeg;base64,"))
	if err != nil {
		log.Printf("failed to decode request image: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	key, err := app.entity.SaveImage(ctx, data, req.Label, user.ID)
	if err != nil {
		log.Printf("failed to store data: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	log.Printf("saved: %s", key.Name)
}
