package app

import (
	"html/template"
	"log"
	"net/http"
	"path/filepath"

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
}

// NewApp function
func NewApp(config *Config) (*App, error) {
	// configure entity client
	entityClient, err := entity.NewClient(config.ProjectID, config.BucketName)
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
	mux := http.NewServeMux()
	mux.HandleFunc("/", app.appHandler)
	mux.HandleFunc("/login", app.loginHandler)
	mux.HandleFunc("/logout", app.logoutHandler)

	authHandler := http.NewServeMux()
	authHandler.HandleFunc("/github", app.oauth2GithubHandler)
	authHandler.HandleFunc("/callback", app.oauth2CallbackHandler)
	mux.Handle("/oauth2/", http.StripPrefix("/oauth2", authHandler))

	apiHandler := http.NewServeMux()
	apiHandler.HandleFunc("/user", app.auth(app.apiUserHandler))
	apiHandler.HandleFunc("/index", app.auth(app.apiIndexHandler))
	apiHandler.HandleFunc("/image/", app.auth(app.apiImageHandler))
	apiHandler.HandleFunc("/images", app.auth(app.apiImagesHandler))
	apiHandler.HandleFunc("/upload", app.auth(app.apiUploadHandler))
	mux.Handle("/api/", http.StripPrefix("/api", apiHandler))

	adminHandler := http.NewServeMux()
	adminHandler.HandleFunc("/count", app.countHandler)
	mux.Handle("/admin/", http.StripPrefix("/admin", adminHandler))

	return mux
}

func (app *App) appHandler(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, "index.html"); err != nil {
		log.Printf("failed to render template: %s", err.Error())
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
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
