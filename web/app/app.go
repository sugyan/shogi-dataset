package app

import (
	"html/template"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/sugyan/shogi-dataset/web/entity"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

// App struct
type App struct {
	isDev   bool
	entity  *entity.Client
	oauth2  *oauth2.Config
	session sessions.Store
}

// Config struct
type Config struct {
	IsDev              bool
	ProjectID          string
	BucketName         string
	Oauth2ClientID     string
	Oauth2ClientSecret string
	Oauth2RedirectURL  string
	CookieKey          string
	RedisURL           string
	RedisPassword      string
}

type appHandler func(http.ResponseWriter, *http.Request) *appError

func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if err := fn(w, r); err != nil {
		log.Printf("failed to process request: %s [%s]", err.message, err.err.Error())
		switch err {
		case errBadRequest:
			http.Error(w, err.message, http.StatusBadRequest)
		case errUnauthorized:
			http.Error(w, err.message, http.StatusUnauthorized)
		case errForbidden:
			http.Error(w, err.message, http.StatusForbidden)
		case errNotFound:
			http.Error(w, err.message, http.StatusNotFound)
		case errMethodNotAllowed:
			http.Error(w, err.message, http.StatusMethodNotAllowed)
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
	}
}

// NewApp function
func NewApp(config *Config) (*App, error) {
	// configure redis pool
	pool := &redis.Pool{
		Dial: func() (redis.Conn, error) {
			conn, err := redis.DialURL("redis://" + config.RedisURL)
			if err != nil {
				return nil, err
			}
			if config.RedisPassword != "" {
				if _, err := conn.Do("AUTH", config.RedisPassword); err != nil {
					return nil, err
				}
			}
			return conn, nil
		},
	}
	// configure entity client
	entityClient, err := entity.NewClient(config.ProjectID, config.BucketName, pool)
	if err != nil {
		return nil, err
	}
	// configure oauth2 config
	oauth2Config := &oauth2.Config{
		ClientID:     config.Oauth2ClientID,
		ClientSecret: config.Oauth2ClientSecret,
		Endpoint:     github.Endpoint,
		RedirectURL:  config.Oauth2RedirectURL,
		Scopes:       []string{},
	}
	// configure session store
	cookieStore := sessions.NewCookieStore([]byte(config.CookieKey))
	cookieStore.Options.HttpOnly = true
	if !config.IsDev {
		cookieStore.Options.Secure = true
	}
	return &App{
		isDev:   config.IsDev,
		entity:  entityClient,
		oauth2:  oauth2Config,
		session: cookieStore,
	}, nil
}

// Handler method
func (app *App) Handler() http.Handler {
	router := mux.NewRouter()

	// router for API endpoints
	apiRouter := router.PathPrefix("/api").Subrouter()
	apiRouter.Use(app.authMiddleware)
	apiRouter.Handle("/user", appHandler(app.apiUserHandler)).
		Methods("GET")
	apiRouter.Handle("/total", appHandler(app.apiTotalHandler)).
		Methods("GET")
	apiRouter.Handle("/latest", appHandler(app.apiLatestHandler)).
		Methods("GET")
	apiRouter.Handle("/images", appHandler(app.apiImagesHandler)).
		Methods("GET")
	apiRouter.Handle("/image/{id:[0-9a-f]+}", appHandler(app.apiImageHandler)).
		Methods("GET", "PUT", "DELETE")
	apiRouter.Handle("/upload", appHandler(app.apiUploadHandler)).
		Methods("POST")
	apiRouter.Handle("/token", appHandler(app.apiTokenHandler)).
		Methods("GET", "POST")

	// router for oauth2 endpoints
	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	authRouter.Handle("/github", appHandler(app.oauth2GithubHandler))
	authRouter.Handle("/callback", appHandler(app.oauth2CallbackHandler)).
		Methods("POST")
	authRouter.Handle("/logout", appHandler(app.logoutHandler)).
		Methods("POST")
	// router for admin endpoints
	adminRouter := router.PathPrefix("/admin").Subrouter()
	adminRouter.Handle("/count", appHandler(app.countHandler))

	// wildcard endpoints
	router.PathPrefix("/").Handler(appHandler(app.appHandler))

	return router
}

func (app *App) appHandler(w http.ResponseWriter, r *http.Request) *appError {
	if err := app.renderTemplate(w, "index.html"); err != nil {
		return &appError{err, "failed to render template"}
	}
	return nil
}

func (app *App) renderTemplate(w http.ResponseWriter, filename string) error {
	t, err := template.ParseFiles(filepath.Join("templates", filename))
	if err != nil {
		return err
	}
	data := map[string]interface{}{}
	if app.isDev {
		data["js"] = "http://localhost:8081"
	} else {
		data["js"] = "/static/js"
	}
	w.Header().Set("Content-Type", "text/html")
	return t.Execute(w, data)
}
