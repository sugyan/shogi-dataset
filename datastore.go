package dataset

import (
	"context"
	"encoding/hex"
	"net/url"
	"strconv"
	"time"

	"crypto/md5"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/taskqueue"
	"google.golang.org/appengine/user"
)

// constant values
const (
	KindImage = "Image"
	KindTotal = "Total"
)

// Image type
type Image struct {
	ImageURL  string
	Label     string
	UserID    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Total type
type Total struct {
	BLANK int `json:"BLANK"`
	BFU   int `json:"B_FU"`
	WFU   int `json:"W_FU"`
	BTO   int `json:"B_TO"`
	WTO   int `json:"W_TO"`
	BKY   int `json:"B_KY"`
	WKY   int `json:"W_KY"`
	BNY   int `json:"B_NY"`
	WNY   int `json:"W_NY"`
	BKE   int `json:"B_KE"`
	WKE   int `json:"W_KE"`
	BNK   int `json:"B_NK"`
	WNK   int `json:"W_NK"`
	BGI   int `json:"B_GI"`
	WGI   int `json:"W_GI"`
	BNG   int `json:"B_NG"`
	WNG   int `json:"W_NG"`
	BKI   int `json:"B_KI"`
	WKI   int `json:"W_KI"`
	BKA   int `json:"B_KA"`
	WKA   int `json:"W_KA"`
	BUM   int `json:"B_UM"`
	WUM   int `json:"W_UM"`
	BHI   int `json:"B_HI"`
	WHI   int `json:"W_HI"`
	BRY   int `json:"B_RY"`
	WRY   int `json:"W_RY"`
	BOU   int `json:"B_OU"`
	WOU   int `json:"W_OU"`
}

// RegisterImage function
func RegisterImage(ctx context.Context, imageData []byte, label string) (*datastore.Key, error) {
	hash := md5.New()
	hash.Write(imageData)
	digest := hex.EncodeToString(hash.Sum(nil))

	created := false
	key := datastore.NewKey(ctx, KindImage, digest, 0, nil)
	image := &Image{}
	if err := datastore.Get(ctx, key, image); err != nil {
		if err == datastore.ErrNoSuchEntity {
			created = true
			image.CreatedAt = time.Now()
		} else {
			log.Errorf(ctx, "failed to get image entity")
			return nil, err
		}
	}

	imageURL, err := storeObject(ctx, digest, imageData)
	if err != nil {
		return nil, err
	}
	log.Infof(ctx, "stored image: %s", imageURL)
	u := user.Current(ctx)
	if u != nil {
		image.UserID = u.ID
	}
	image.ImageURL = imageURL
	image.Label = label
	image.UpdatedAt = time.Now()
	key, err = datastore.Put(ctx, key, image)
	if err != nil {
		log.Errorf(ctx, "failed to put image entity")
		return nil, err
	}
	log.Infof(ctx, "stored entity: %s", key.Encode())

	if created {
		if err := addTask(ctx, label, 1); err != nil {
			log.Errorf(ctx, "failed to add task: %s", err.Error())
			return nil, err
		}
	}
	return key, nil
}

func addTask(ctx context.Context, label string, amount int) error {
	params := url.Values{}
	params.Add("label", label)
	params.Add("amount", strconv.Itoa(amount))
	task, err := taskqueue.Add(ctx, taskqueue.NewPOSTTask("/admin/task", params), "default")
	if err != nil {
		return err
	}
	log.Infof(ctx, "task %s added", task.Name)
	return nil
}
