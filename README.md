
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
export PROJECT_ID=<Project ID>
export DEBUG=true
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
export REACT_APP_MODEL_URL=<MODEL URL> # CORS must be supported
npm run build
gcloud app deploy web
```


## Download

### Preparation

Clone http://github.com/tensorflow/tensorflow

```sh
export TENSORFLOW_DIR=<TENSORFLOW ROOT>
go get -u github.com/golang/protobuf/protoc-gen-go
protoc -I $TENSORFLOW_DIR $TENSORFLOW_DIR/tensorflow/core/example/example.proto --go_out $(go env GOPATH)/src
protoc -I $TENSORFLOW_DIR $TENSORFLOW_DIR/tensorflow/core/example/feature.proto --go_out $(go env GOPATH)/src
```

### Execution

```sh
go run cmd/download/main.go -host <HOSTNAME> -token <API token>
```
