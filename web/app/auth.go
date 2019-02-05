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
	"strings"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset/web/entity"
)

type contextKey string

const (
	defaultSessionID = "default"
	userSessionKey   = "user"

	contextKeyUser contextKey = "user"

	githubUserAPIURL = "https://api.github.com/user"
)

type user struct {
	ID   int64
	Role entity.UserRole
}

func (u *user) canEdit() bool {
	if u.Role == entity.RoleEditor {
		return true
	}
	return false
}

func init() {
	gob.Register(&user{})
}

func (app *App) logoutHandler(w http.ResponseWriter, r *http.Request) *appError {
	session, err := app.session.New(r, defaultSessionID)
	if err != nil {
		return &appError{err, "failed to create new session"}
	}
	session.Options.MaxAge = -1
	if err := session.Save(r, w); err != nil {
		return &appError{err, "failed to save session"}
	}
	http.Redirect(w, r, "/", http.StatusFound)
	return nil
}

func (app *App) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := func() error {
			// retrieve from session
			session, err := app.session.Get(r, defaultSessionID)
			if err != nil {
				return err
			}
			if value, exist := session.Values[userSessionKey]; exist {
				if u, ok := value.(*user); ok {
					r = r.WithContext(context.WithValue(r.Context(), contextKeyUser, u))
					return nil
				}
			}
			// retrieve from heaaders
			authHeader := r.Header.Get("Authorization")
			bearerPrefix := "Bearer "
			if strings.HasPrefix(authHeader, bearerPrefix) {
				token := strings.TrimPrefix(authHeader, bearerPrefix)
				t, err := app.entity.FetchToken(r.Context(), token)
				if err != nil {
					if err == datastore.ErrNoSuchEntity {
						return nil
					}
					return err
				}
				u, err := app.entity.FetchUser(r.Context(), t.User.ID)
				if err != nil {
					return err
				}
				r = r.WithContext(context.WithValue(r.Context(), contextKeyUser, &user{t.User.ID, u.Role}))
			}
			return nil
		}(); err != nil {
			log.Printf("failed to process request in auth middleware: %s", err.Error())
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (app *App) currentUser(ctx context.Context) *user {
	if u, ok := ctx.Value(contextKeyUser).(*user); ok {
		return u
	}
	return nil
}

func (app *App) oauth2GithubHandler(w http.ResponseWriter, r *http.Request) *appError {
	b := make([]byte, 8)
	_, err := rand.Read(b)
	if err != nil {
		return &appError{err, "failed to generate state"}
	}
	state := fmt.Sprintf("%02x", b)
	// save state to session
	stateSession, err := app.session.New(r, state)
	if err != nil {
		return &appError{err, "failed to create new session"}
	}
	stateSession.Options.MaxAge = 10 * 60 // 10 minutes
	if err := stateSession.Save(r, w); err != nil {
		return &appError{err, "failed to save session"}
	}
	http.Redirect(w, r, app.oauth2.AuthCodeURL(state), http.StatusFound)
	return nil
}

func (app *App) oauth2CallbackHandler(w http.ResponseWriter, r *http.Request) *appError {
	ctx := r.Context()
	// validate state
	stateSession, err := app.session.Get(r, r.FormValue("state"))
	if err != nil {
		return &appError{err, "failed to get session"}
	}
	if stateSession.IsNew {
		log.Printf("invalid state value")
		return errBadRequest
	}
	// get token and profile
	token, err := app.oauth2.Exchange(ctx, r.FormValue("code"))
	if err != nil {
		return &appError{err, "failed to exchange to token"}
	}
	client := oauth2.NewClient(ctx, oauth2.StaticTokenSource(token))
	res, err := client.Get(githubUserAPIURL)
	if err != nil {
		return &appError{err, "failed to get user info"}
	}
	defer res.Body.Close()
	userInfo := struct {
		ID    int64  `json:"id"`
		Login string `json:"login"`
	}{}
	if err := json.NewDecoder(res.Body).Decode(&userInfo); err != nil {
		return &appError{err, "failed to encode json"}
	}
	// save user info to datastore
	u, err := app.entity.SaveUser(ctx, userInfo.ID, userInfo.Login)
	if err != nil {
		return &appError{err, "failed to save user info"}
	}
	// save user info to session
	defaultSession, err := app.session.New(r, defaultSessionID)
	if err != nil {
		return &appError{err, "failed to create new session"}
	}
	defaultSession.Values[userSessionKey] = &user{
		ID:   userInfo.ID,
		Role: u.Role,
	}
	if err := defaultSession.Save(r, w); err != nil {
		return &appError{err, "failed to save session"}
	}
	http.Redirect(w, r, "/", http.StatusFound)
	return nil
}
