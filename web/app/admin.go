package app

import (
	"log"
	"net/http"
)

func (app *App) countHandler(w http.ResponseWriter, r *http.Request) *appError {
	if r.Header.Get("X-Appengine-Cron") != "true" {
		return errNotFound
	}

	if err := app.entity.CountTotal(r.Context()); err != nil {
		return &appError{err, "failed to count total"}
	}
	log.Printf("count done.")
	return nil
}
