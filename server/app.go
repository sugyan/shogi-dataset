package app

import (
	"html/template"
	"net/http"

	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
)

func init() {
	http.HandleFunc("/", appHandler)
	http.HandleFunc("/count", countHandler)
	http.HandleFunc("/task", taskHandler)
}

func appHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	if err := renderTemplate(w); err != nil {
		log.Errorf(ctx, "failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func renderTemplate(w http.ResponseWriter) error {
	t, err := template.ParseFiles("templates/index.html")
	if err != nil {
		return err
	}
	data := map[string]interface{}{}
	if appengine.IsDevAppServer() {
		data["js"] = "http://localhost:8081"
	} else {
		data["js"] = "/static/js"
	}
	w.Header().Set("Content-Type", "text/html")
	return t.Execute(w, data)
}
