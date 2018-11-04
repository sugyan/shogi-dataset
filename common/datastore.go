package common

import (
	"bytes"
	"context"
	"encoding/hex"
	"fmt"
	"io"
	"net/url"
	"reflect"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"crypto/md5"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/file"
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

// TotalUpdate type
type TotalUpdate struct {
	Label  string
	Amount int
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

// DeleteImage function
func DeleteImage(ctx context.Context, key *datastore.Key) error {
	if err := deleteObject(ctx, key.StringID()); err != nil {
		log.Errorf(ctx, "failed to delete object: %s", err.Error())
		return err
	}
	image := &Image{}
	if err := datastore.Get(ctx, key, image); err != nil {
		log.Errorf(ctx, "failed to et entity: %s", err.Error())
		return err
	}
	if err := datastore.Delete(ctx, key); err != nil {
		log.Errorf(ctx, "failed to delete entity: %s", err.Error())
		return err
	}
	if err := UpdateTotal(ctx, &TotalUpdate{image.Label, -1}); err != nil {
		log.Errorf(ctx, "failed to update total: %s", err.Error())
		return err
	}
	return nil
}

// EditImage function
func EditImage(ctx context.Context, key *datastore.Key, nextLabel string) error {
	var prevLabel string
	image := &Image{}
	if err := datastore.Get(ctx, key, image); err != nil {
		log.Errorf(ctx, "failed to get image entity: %s", err.Error())
		return err
	}
	prevLabel = image.Label
	if nextLabel == prevLabel {
		return nil
	}
	// set new label
	image.Label = nextLabel
	image.UpdatedAt = time.Now()
	if _, err := datastore.Put(ctx, key, image); err != nil {
		log.Errorf(ctx, "failed to get image entity: %s", err.Error())
		return err
	}
	updates := []*TotalUpdate{
		{prevLabel, -1},
		{nextLabel, +1},
	}
	if err := UpdateTotal(ctx, updates...); err != nil {
		log.Errorf(ctx, "failed to update total: %s", err.Error())
		return err
	}
	return nil
}

func storeObject(ctx context.Context, fileName string, data []byte) (string, error) {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return "", err
	}
	defer client.Close()

	bucketName, err := file.DefaultBucketName(ctx)
	if err != nil {
		return "", err
	}
	w := client.Bucket(bucketName).Object(fileName).NewWriter(ctx)
	w.ACL = []storage.ACLRule{
		{
			Entity: storage.AllUsers,
			Role:   storage.RoleReader,
		},
	}
	r := bytes.NewReader(data)
	if _, err := io.Copy(w, r); err != nil {
		return "", err
	}
	if err := w.Close(); err != nil {
		return "", err
	}
	return fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, fileName), nil
}

func deleteObject(ctx context.Context, fileName string) error {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	bucketName, err := file.DefaultBucketName(ctx)
	if err != nil {
		return err
	}
	if err := client.Bucket(bucketName).Object(fileName).Delete(ctx); err != nil {
		return err
	}
	return nil
}

func totalKey(ctx context.Context) *datastore.Key {
	return datastore.NewKey(ctx, KindTotal, "", 1, nil)
}

// GetTotal function
func GetTotal(ctx context.Context) (*Total, error) {
	total := &Total{}
	if err := datastore.Get(ctx, totalKey(ctx), total); err != nil {
		if err == datastore.ErrNoSuchEntity {
			if _, err := datastore.Put(ctx, totalKey(ctx), total); err != nil {
				log.Infof(ctx, "failed to put entity: %s", err.Error())
				return nil, err
			}
		} else {
			log.Infof(ctx, "failed to get entity: %s", err.Error())
			return nil, err
		}
	}
	return total, nil
}

// UpdateTotal function
func UpdateTotal(ctx context.Context, updates ...*TotalUpdate) error {
	if err := datastore.RunInTransaction(ctx, func(ctx context.Context) error {
		total, err := GetTotal(ctx)
		if err != nil {
			return err
		}
		for _, update := range updates {
			fieldName := strings.Replace(update.Label, "_", "", -1)
			fieldValue := reflect.Indirect(reflect.ValueOf(total)).FieldByName(fieldName)
			if num, ok := fieldValue.Interface().(int); ok {
				fieldValue.Set(reflect.ValueOf(num + update.Amount))
			}
		}
		if _, err := datastore.Put(ctx, totalKey(ctx), total); err != nil {
			return err
		}
		return nil
	}, nil); err != nil {
		log.Errorf(ctx, "failed to run transaction: %s", err.Error())
		return err
	}
	return nil
}

// CountTotal function
func CountTotal(ctx context.Context) error {
	total := &Total{}
	targetLabels := []string{
		"BLANK",
		"B_FU", "B_TO", "B_KY", "B_NY", "B_KE", "B_NK", "B_GI", "B_NG", "B_KI", "B_KA", "B_UM", "B_HI", "B_RY", "B_OU",
		"W_FU", "W_TO", "W_KY", "W_NY", "W_KE", "W_NK", "W_GI", "W_NG", "W_KI", "W_KA", "W_UM", "W_HI", "W_RY", "W_OU",
	}
	for _, label := range targetLabels {
		num, err := datastore.NewQuery(KindImage).Filter("Label =", label).Count(ctx)
		if err != nil {
			log.Errorf(ctx, "failed to count label %s: %s", label, err.Error())
			return err
		}
		fieldName := strings.Replace(label, "_", "", -1)
		reflect.Indirect(reflect.ValueOf(total)).FieldByName(fieldName).Set(reflect.ValueOf(num))
	}
	if _, err := datastore.Put(ctx, totalKey(ctx), total); err != nil {
		log.Errorf(ctx, "failed to put entity: %s", err.Error())
		return err
	}
	return nil
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
