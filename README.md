
# shogi-dataset

## Development

### Back-end

```
$ dev_appserver.py --application local --default_gcs_bucket_name staging.<PROJECT ID>.appspot.com server
```

### Front-end

```
$ cd frontend
$ npm install
$ npm start
```


## Deployment

```
$ export MODEL_URL_BASE=<MODEL URL> # CORS must be supported
$ npm run build
$ gcloud app deploy server
```


## Download

### Preparation

Clone http://github.com/tensorflow/tensorflow

```
$ export TENSORFLOW_DIR=<TENSORFLOW ROOT>
$ go get -u github.com/golang/protobuf/protoc-gen-go
$ protoc -I $TENSORFLOW_DIR $TENSORFLOW_DIR/tensorflow/core/example/example.proto --go_out $(go env GOPATH)/src
$ protoc -I $TENSORFLOW_DIR $TENSORFLOW_DIR/tensorflow/core/example/feature.proto --go_out $(go env GOPATH)/src
```

### Execution

```
$ go run cmd/download/main.go -host <HOSTNAME> -projectID <PROJECT ID>
```
