
# shogi-dataset

## Development

### Back-end

```
$ dev_appserver.py --application local --default_gcs_bucket_name staging.<APPLICTION ID>.appspot.com server
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
