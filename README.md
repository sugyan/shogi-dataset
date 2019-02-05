
# shogi-dataset

## Development

### Back-end

#### Set environment variables

```
cp web/env.example.yaml web/env.yaml
# edit web/env.yaml
```

#### Launch dev server

```
dev_appserver.py --application <PROJECT ID> web
```

### Front-end

```
cd frontend
npm install
npm start
```


## Deployment

```
export MODEL_URL_BASE=<MODEL URL> # CORS must be supported
npm run build
gcloud app deploy web
```


## Download

### Preparation

Clone http://github.com/tensorflow/tensorflow

```
export TENSORFLOW_DIR=<TENSORFLOW ROOT>
go get -u github.com/golang/protobuf/protoc-gen-go
protoc -I $TENSORFLOW_DIR $TENSORFLOW_DIR/tensorflow/core/example/example.proto --go_out $(go env GOPATH)/src
protoc -I $TENSORFLOW_DIR $TENSORFLOW_DIR/tensorflow/core/example/feature.proto --go_out $(go env GOPATH)/src
```

### Execution

```
go run cmd/download/main.go -host <HOSTNAME> -token <API token>
```
