package app

import (
	"log"
	"net/http"
)

func (app *App) countHandler(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("X-Appengine-Cron") != "true" {
		http.NotFound(w, r)
		return
	}

	if err := app.entity.CountTotal(r.Context()); err != nil {
		log.Printf("failed to count total: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	log.Printf("count done.")
}
