package dataset

// import (
// 	"context"
// 	"crypto/md5"
// 	"encoding/hex"
// 	"net/url"
// 	"strconv"
// 	"time"

// 	"google.golang.org/appengine/datastore"
// 	"google.golang.org/appengine/log"
// 	"google.golang.org/appengine/taskqueue"
// 	"google.golang.org/appengine/user"
// )

// // RegisterImage function
// func RegisterImage(ctx context.Context, imageData []byte, label string) (*datastore.Key, error) {
// 	hash := md5.New()
// 	hash.Write(imageData)
// 	digest := hex.EncodeToString(hash.Sum(nil))

// 	created := false
// 	key := datastore.NewKey(ctx, KindImage, digest, 0, nil)
// 	image := &Image{}
// 	if err := datastore.Get(ctx, key, image); err != nil {
// 		if err == datastore.ErrNoSuchEntity {
// 			created = true
// 			image.CreatedAt = time.Now()
// 		} else {
// 			log.Errorf(ctx, "failed to get image entity")
// 			return nil, err
// 		}
// 	}

// 	imageURL, err := storeObject(ctx, digest, imageData)
// 	if err != nil {
// 		return nil, err
// 	}
// 	log.Infof(ctx, "stored image: %s", imageURL)
// 	u := user.Current(ctx)
// 	if u != nil {
// 		image.UserID = u.ID
// 	}
// 	image.ImageURL = imageURL
// 	image.Label = label
// 	image.UpdatedAt = time.Now()
// 	key, err = datastore.Put(ctx, key, image)
// 	if err != nil {
// 		log.Errorf(ctx, "failed to put image entity")
// 		return nil, err
// 	}
// 	log.Infof(ctx, "stored entity: %s", key.Encode())

// 	if created {
// 		if err := addTask(ctx, label, 1); err != nil {
// 			log.Errorf(ctx, "failed to add task: %s", err.Error())
// 			return nil, err
// 		}
// 	}
// 	return key, nil
// }

// func addTask(ctx context.Context, label string, amount int) error {
// 	params := url.Values{}
// 	params.Add("label", label)
// 	params.Add("amount", strconv.Itoa(amount))
// 	task, err := taskqueue.Add(ctx, taskqueue.NewPOSTTask("/admin/task", params), "default")
// 	if err != nil {
// 		return err
// 	}
// 	log.Infof(ctx, "task %s added", task.Name)
// 	return nil
// }
