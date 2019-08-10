package main

import (
	"context"
	"flag"
	"log"
	"os"

	"cloud.google.com/go/datastore"
	"github.com/sugyan/shogi-dataset/web/entity"
	"google.golang.org/api/iterator"
)

var id int64

func init() {
	flag.Int64Var(&id, "id", 0, "user id")
}

func main() {
	flag.Parse()

	ctx := context.Background()
	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	client, err := datastore.NewClient(ctx, projectID)
	if err != nil {
		log.Fatal(err)
	}
	q := datastore.NewQuery(entity.KindUser)
	iter := client.Run(ctx, q)
	for {
		var u entity.User
		key, err := iter.Next(&u)
		if err != nil {
			if err == iterator.Done {
				break
			} else {
				log.Fatal(err)
			}
		}
		if key.ID == id {
			log.Printf("%v", u)
			u.Role = entity.RoleEditor
			if _, err := client.Put(ctx, key, &u); err != nil {
				log.Fatal(err)
			}
		}
	}
}
