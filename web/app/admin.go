package app

// import (
// 	"net/http"
// 	"strconv"

// 	"google.golang.org/appengine"
// 	"google.golang.org/appengine/log"
// )

// func init() {
// 	adminHandler := http.NewServeMux()
// 	adminHandler.HandleFunc("/count", countHandler)
// 	adminHandler.HandleFunc("/task", taskHandler)
// 	http.Handle("/admin/", http.StripPrefix("/admin", adminHandler))
// }

// func countHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Header.Get("X-Appengine-Cron") != "true" {
// 		http.NotFound(w, r)
// 		return
// 	}

// 	ctx := appengine.NewContext(r)
// 	if err := countTotal(ctx); err != nil {
// 		log.Errorf(ctx, "failed to count total: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
// 		return
// 	}
// 	log.Infof(ctx, "count done.")
// }

// func taskHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != "POST" || r.Header.Get("X-AppEngine-QueueName") != "default" {
// 		http.NotFound(w, r)
// 		return
// 	}
// 	taskName := r.Header.Get("X-AppEngine-TaskName")

// 	ctx := appengine.NewContext(r)
// 	if err := r.ParseForm(); err != nil {
// 		log.Errorf(ctx, "failed to parse request form: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
// 		return
// 	}
// 	label := r.Form.Get("label")
// 	amount, err := strconv.Atoi(r.Form.Get("amount"))
// 	if err != nil {
// 		log.Errorf(ctx, "failed to parse amount value: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
// 		return
// 	}

// 	update := &totalUpdate{
// 		label:  label,
// 		amount: amount,
// 	}
// 	if err := updateTotal(ctx, update); err != nil {
// 		log.Errorf(ctx, "failed to update total count: %s", err.Error())
// 		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
// 		return
// 	}
// 	log.Infof(ctx, "task %s done.", taskName)
// }
