package app

import (
	"html/template"
	"log"
	"net/http"

	"github.com/sugyan/shogi-dataset/web/entity"
)

// App struct
type App struct {
	isDev  bool
	entity *entity.Client
}

// NewApp function
func NewApp(projectID, bucketName string, isDev bool) (*App, error) {
	// configure entity client
	entityClient, err := entity.NewClient(projectID, bucketName)
	if err != nil {
		return nil, err
	}

	return &App{
		isDev:  isDev,
		entity: entityClient,
	}, nil
}

// Handler method
func (app *App) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", app.appHandler)
	// mux.HandleFunc("/count", countHandler)
	// mux.HandleFunc("/task", taskHandler)

	apiHandler := http.NewServeMux()
	apiHandler.HandleFunc("/index", app.apiIndexHandler)
	apiHandler.HandleFunc("/image/", app.apiImageHandler)
	apiHandler.HandleFunc("/images", app.apiImagesHandler)
	apiHandler.HandleFunc("/upload", app.apiUploadHandler)
	mux.Handle("/api/", http.StripPrefix("/api", apiHandler))

	// adminHandler := http.NewServeMux()
	// adminHandler.HandleFunc("/count", countHandler)
	// adminHandler.HandleFunc("/task", taskHandler)
	// mux.Handle("/admin/", http.StripPrefix("/admin", adminHandler))

	return mux
}

func (app *App) appHandler(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w); err != nil {
		log.Printf("failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func (app *App) renderTemplate(w http.ResponseWriter) error {
	t, err := template.ParseFiles("templates/index.html")
	if err != nil {
		return err
	}
	data := map[string]interface{}{}
	if app.isDev {
		data["js"] = "http://localhost:8081"
	} else {
		data["js"] = "/static/js"
	}
	w.Header().Set("Content-Type", "text/html")
	return t.Execute(w, data)
}
