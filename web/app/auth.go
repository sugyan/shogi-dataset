package app

import (
	"context"
	"crypto/rand"
	"encoding/gob"
	"fmt"
	"log"
	"net/http"
)

type contextKey string

const (
	defaultSessionID = "default"
	userSessionKey   = "user"

	contextKeyUser contextKey = "user"
)

type user struct {
	ID string
}

func init() {
	gob.Register(&user{})
}

func (app *App) loginHandler(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, "login.html"); err != nil {
		log.Printf("failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func (app *App) logoutHandler(w http.ResponseWriter, r *http.Request) {
	if err := func() error {
		session, err := app.session.New(r, defaultSessionID)
		if err != nil {
			return err
		}
		session.Options.MaxAge = -1
		if err := session.Save(r, w); err != nil {
			return err
		}
		return nil
	}(); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/", http.StatusFound)
}

func (app *App) auth(handler func(http.ResponseWriter, *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := func() error {
			session, err := app.session.Get(r, defaultSessionID)
			if err != nil {
				return err
			}
			if value, exist := session.Values[userSessionKey]; exist {
				if u, ok := value.(*user); ok {
					r = r.WithContext(context.WithValue(r.Context(), contextKeyUser, u))
				}
			}
			return nil
		}(); err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		handler(w, r)
	}
}

func (app *App) currentUser(ctx context.Context) *user {
	if u, ok := ctx.Value(contextKeyUser).(*user); ok {
		return u
	}
	return nil
}

func (app *App) oauth2GithubHandler(w http.ResponseWriter, r *http.Request) {
	if err := func() error {
		b := make([]byte, 8)
		_, err := rand.Read(b)
		if err != nil {
			return err
		}
		state := fmt.Sprintf("%02x", b)
		// TODO: save state to session
		http.Redirect(w, r, app.oauth2.AuthCodeURL(state), http.StatusFound)
		return nil
	}(); err != nil {
		log.Printf("failed to redirect: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (app *App) oauth2CallbackHandler(w http.ResponseWriter, r *http.Request) {
	if err := func() error {
		// TODO: validate state
		// TODO: get token and profile

		// save user info to session
		defaultSession, err := app.session.New(r, defaultSessionID)
		if err != nil {
			return err
		}
		defaultSession.Values[userSessionKey] = &user{
			ID: "user",
		}
		if err := defaultSession.Save(r, w); err != nil {
			return err
		}

		http.Redirect(w, r, "/", http.StatusFound)
		return nil
	}(); err != nil {
		log.Printf("failed to process callback request: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
