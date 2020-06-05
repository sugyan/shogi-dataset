# shogi-dataset

## Development

### Back-end

#### Set environment variables

```sh
cp web/env.example.yaml web/env.yaml
# edit web/env.yaml
```

#### Launch dev server

```sh
gcloud beta emulators datastore start
```

```sh
$(gcloud beta emulators datastore env-init)
export MODE=development
export GOOGLE_CLOUD_PROJECT=<Project ID>
# set other env variables
go run web/main.go
```

### Front-end

```sh
cd frontend
npm install
npm start
```


## Deployment

```sh
export REACT_APP_MODEL_URL_BASE=<MODEL URL BASE> # CORS must be supported
npm run build
gcloud app deploy web
```


## Download

```sh
go run cmd/download/main.go -host <HOSTNAME> -token <API token>
```
