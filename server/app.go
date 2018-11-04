package app

import (
	"html/template"
	"net/http"
	"strconv"

	"github.com/sugyan/shogi-dataset/common"
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

func countHandler(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("X-Appengine-Cron") != "true" {
		http.NotFound(w, r)
		return
	}

	ctx := appengine.NewContext(r)
	if err := common.CountTotal(ctx); err != nil {
		log.Errorf(ctx, "failed to count total: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	log.Infof(ctx, "count done.")
}

func taskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" || r.Header.Get("X-AppEngine-QueueName") != "default" {
		http.NotFound(w, r)
		return
	}
	taskName := r.Header.Get("X-AppEngine-TaskName")

	ctx := appengine.NewContext(r)
	if err := r.ParseForm(); err != nil {
		log.Errorf(ctx, "failed to parse request form: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}
	label := r.Form.Get("label")
	amount, err := strconv.Atoi(r.Form.Get("amount"))
	if err != nil {
		log.Errorf(ctx, "failed to parse amount value: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	update := &common.TotalUpdate{
		Label:  label,
		Amount: amount,
	}
	if err := common.UpdateTotal(ctx, update); err != nil {
		log.Errorf(ctx, "failed to update total count: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	log.Infof(ctx, "task %s done.", taskName)
}
