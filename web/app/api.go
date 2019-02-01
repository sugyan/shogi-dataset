package app

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"

	"cloud.google.com/go/datastore"
	"github.com/gorilla/mux"
	"github.com/sugyan/shogi-dataset/web/entity"
)

type filter struct {
	filterStr string
	value     interface{}
}

func (app *App) apiUserHandler(w http.ResponseWriter, r *http.Request) *appError {
	result := struct {
		Name string `json:"name,omitempty"`
		Role string `json:"role,omitempty"`
	}{}
	u := app.currentUser(r.Context())
	if u != nil {
		user, err := app.entity.GetUser(r.Context(), u.ID)
		if err != nil {
			return &appError{err, "failed to get user"}
		}
		result.Name = user.Name
		result.Role = string(user.Role)
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		return &appError{err, "failed to encode json"}
	}
	return nil
}

func (app *App) apiTotalHandler(w http.ResponseWriter, r *http.Request) *appError {
	total, err := app.entity.GetTotal(r.Context())
	if err != nil {
		return &appError{err, "failed to fetch total"}
	}
	if err := json.NewEncoder(w).Encode(total); err != nil {
		return &appError{err, "failed to render json"}
	}
	return nil
}

func (app *App) apiLatestHandler(w http.ResponseWriter, r *http.Request) *appError {
	results, err := app.entity.FetchRecentImages(r.Context(), url.Values{})
	if err != nil {
		return &appError{err, "failed to fetch images"}
	}
	if err := json.NewEncoder(w).Encode(results); err != nil {
		return &appError{err, "failed to render json"}
	}
	return nil
}

func (app *App) apiImagesHandler(w http.ResponseWriter, r *http.Request) *appError {
	ctx := r.Context()
	u := app.currentUser(ctx)
	if u == nil {
		return errUnauthorized
	}
	results, err := app.entity.FetchRecentImages(ctx, r.URL.Query())
	if err != nil {
		return &appError{err, "failed to fetch images"}
	}
	if err := json.NewEncoder(w).Encode(results); err != nil {
		return &appError{err, "failed to render json"}
	}
	return nil
}

func (app *App) apiImageHandler(w http.ResponseWriter, r *http.Request) *appError {
	name := mux.Vars(r)["id"]
	key := datastore.NameKey(entity.KindImage, name, nil)
	ctx := r.Context()
	switch r.Method {
	case "GET":
		image, err := app.entity.GetImage(ctx, key)
		if err != nil {
			return errNotFound
		}
		if err := json.NewEncoder(w).Encode(image); err != nil {
			return &appError{err, "failed to encode json"}
		}
	case "DELETE":
		u := app.currentUser(ctx)
		if u != nil && u.canEdit() {
			if err := app.entity.DeleteImage(ctx, key); err != nil {
				return &appError{err, "failed to delete image"}
			}
		} else {
			return errForbidden
		}
	case "PUT":
		u := app.currentUser(ctx)
		if u != nil && u.canEdit() {
			if err := r.ParseForm(); err != nil {
				return &appError{err, "failed to parse form"}
			}
			if err := app.entity.UpdateImage(ctx, key, r.Form.Get("label")); err != nil {
				return &appError{err, "failed to update image"}
			}
		} else {
			return errForbidden
		}
	default:
		return errMethodNotAllowed
	}
	return nil
}

func (app *App) apiUploadHandler(w http.ResponseWriter, r *http.Request) *appError {
	ctx := r.Context()
	u := app.currentUser(ctx)
	if !(u != nil && u.canEdit()) {
		return errForbidden
	}
	req := struct {
		Label string `json:"label"`
		Image string `json:"image"`
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return &appError{err, "failed to decode request body"}
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(req.Image, "data:image/jpeg;base64,"))
	if err != nil {
		return &appError{err, "failed to decode request image"}
	}
	key, err := app.entity.SaveImage(ctx, data, req.Label, u.ID)
	if err != nil {
		return &appError{err, "failed to store data"}
	}
	log.Printf("saved: %s", key.Name)
	return nil
}

func (app *App) apiTokenHandler(w http.ResponseWriter, r *http.Request) *appError {
	ctx := r.Context()
	u := app.currentUser(ctx)
	if u == nil {
		return errUnauthorized
	}

	switch r.Method {
	case "GET":
		keys, err := app.entity.FetchTokens(ctx, u.ID)
		if err != nil {
			return &appError{err, "failed to get token"}
		}
		tokens := []string{}
		for _, key := range keys {
			tokens = append(tokens, key.Name)
		}
		if err := json.NewEncoder(w).Encode(tokens); err != nil {
			return &appError{err, "failed to encode json"}
		}
	case "POST":
		key, err := app.entity.GenerateToken(ctx, u.ID)
		if err != nil {
			return &appError{err, "failed to generate token"}
		}
		tokens := []string{key.Name}
		if err := json.NewEncoder(w).Encode(tokens); err != nil {
			return &appError{err, "failed to encode json"}
		}
	default:
		return errMethodNotAllowed
	}
	return nil
}
