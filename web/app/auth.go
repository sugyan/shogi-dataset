package app

import (
	"context"
	"crypto/rand"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"golang.org/x/oauth2"
	"log"
	"net/http"

	"github.com/sugyan/shogi-dataset/web/entity"
)

type contextKey string

const (
	defaultSessionID = "default"
	userSessionKey   = "user"

	contextKeyUser contextKey = "user"

	githubUserAPIURL = "https://api.github.com/user"
)

var errInvalidState = fmt.Errorf("invalid state")

type user struct {
	ID   int64
	Role entity.UserRole
}

func init() {
	gob.Register(&user{})
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
		// save state to session
		stateSession, err := app.session.New(r, state)
		if err != nil {
			return err
		}
		stateSession.Options.MaxAge = 10 * 60 // 10 minutes
		if err := stateSession.Save(r, w); err != nil {
			return err
		}
		http.Redirect(w, r, app.oauth2.AuthCodeURL(state), http.StatusFound)

		return nil
	}(); err != nil {
		log.Printf("failed to redirect: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (app *App) oauth2CallbackHandler(w http.ResponseWriter, r *http.Request) {
	if err := func(ctx context.Context) error {
		// validate state
		stateSession, err := app.session.Get(r, r.FormValue("state"))
		if err != nil {
			return err
		}
		if stateSession.IsNew {
			return errInvalidState
		}
		// get token and profile
		token, err := app.oauth2.Exchange(ctx, r.FormValue("code"))
		if err != nil {
			return err
		}
		client := oauth2.NewClient(ctx, oauth2.StaticTokenSource(token))
		res, err := client.Get(githubUserAPIURL)
		if err != nil {
			return err
		}
		defer res.Body.Close()
		userInfo := struct {
			ID    int64  `json:"id"`
			Login string `json:"login"`
		}{}
		if err := json.NewDecoder(res.Body).Decode(&userInfo); err != nil {
			return err
		}
		// save user info to datastore
		u, err := app.entity.SaveUser(r.Context(), userInfo.ID, userInfo.Login)
		if err != nil {
			return err
		}
		// save user info to session
		defaultSession, err := app.session.New(r, defaultSessionID)
		if err != nil {
			return err
		}
		defaultSession.Values[userSessionKey] = &user{
			ID:   userInfo.ID,
			Role: u.Role,
		}
		if err := defaultSession.Save(r, w); err != nil {
			return err
		}
		http.Redirect(w, r, "/", http.StatusFound)

		return nil
	}(r.Context()); err != nil {
		log.Printf("failed to process callback request: %s", err.Error())
		if err == errInvalidState {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
		return
	}
}
