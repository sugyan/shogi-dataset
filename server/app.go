package app

import (
	"html/template"
	"net/http"

	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
)

func init() {
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/upload", uploadHandler)
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	if err := renderTemplate(w, "index.html", nil); err != nil {
		log.Errorf(ctx, "failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	if err := renderTemplate(w, "upload.html", nil); err != nil {
		log.Errorf(ctx, "failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func renderTemplate(w http.ResponseWriter, templateFile string, data map[string]interface{}) error {
	t, err := template.ParseFiles("templates/layout.html", "templates/"+templateFile)
	if err != nil {
		return err
	}
	if data == nil {
		data = make(map[string]interface{})
	}
	if appengine.IsDevAppServer() {
		data["js"] = "http://localhost:8081"
	} else {
		data["js"] = "/static/js"
	}
	w.Header().Set("Content-Type", "text/html")
	return t.Execute(w, data)
}
