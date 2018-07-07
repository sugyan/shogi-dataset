package app

import (
	"html/template"
	"net/http"

	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
)

func init() {
	http.HandleFunc("/", indexHandler)
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	if err := renderTemplate(w, "index.html", nil); err != nil {
		log.Errorf(ctx, "failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func renderTemplate(w http.ResponseWriter, templateFile string, data interface{}) error {
	t, err := template.ParseFiles("templates/layout.html", "templates/"+templateFile)
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "text/html")
	return t.Execute(w, data)
}
