package app

import (
	"context"
	"reflect"
	"strings"
	"time"

	"github.com/sugyan/shogi-dataset/common"
	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/log"
)

type totalUpdate struct {
	label  string
	amount int
}

func deleteImage(ctx context.Context, key *datastore.Key) error {
	if err := common.DeleteObject(ctx, key.StringID()); err != nil {
		log.Errorf(ctx, "failed to delete object: %s", err.Error())
		return err
	}
	image := &common.Image{}
	if err := datastore.Get(ctx, key, image); err != nil {
		log.Errorf(ctx, "failed to et entity: %s", err.Error())
		return err
	}
	if err := datastore.Delete(ctx, key); err != nil {
		log.Errorf(ctx, "failed to delete entity: %s", err.Error())
		return err
	}
	if err := updateTotal(ctx, &totalUpdate{image.Label, -1}); err != nil {
		log.Errorf(ctx, "failed to update total: %s", err.Error())
		return err
	}
	return nil
}

func editImage(ctx context.Context, key *datastore.Key, nextLabel string) error {
	var prevLabel string
	image := &common.Image{}
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
	updates := []*totalUpdate{
		{prevLabel, -1},
		{nextLabel, +1},
	}
	if err := updateTotal(ctx, updates...); err != nil {
		log.Errorf(ctx, "failed to update total: %s", err.Error())
		return err
	}
	return nil
}

func totalKey(ctx context.Context) *datastore.Key {
	return datastore.NewKey(ctx, common.KindTotal, "", 1, nil)
}

func getTotal(ctx context.Context) (*common.Total, error) {
	total := &common.Total{}
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

func updateTotal(ctx context.Context, updates ...*totalUpdate) error {
	if err := datastore.RunInTransaction(ctx, func(ctx context.Context) error {
		total, err := getTotal(ctx)
		if err != nil {
			return err
		}
		for _, update := range updates {
			fieldName := strings.Replace(update.label, "_", "", -1)
			fieldValue := reflect.Indirect(reflect.ValueOf(total)).FieldByName(fieldName)
			if num, ok := fieldValue.Interface().(int); ok {
				fieldValue.Set(reflect.ValueOf(num + update.amount))
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

func countTotal(ctx context.Context) error {
	total := &common.Total{}
	targetLabels := []string{
		"BLANK",
		"B_FU", "B_TO", "B_KY", "B_NY", "B_KE", "B_NK", "B_GI", "B_NG", "B_KI", "B_KA", "B_UM", "B_HI", "B_RY", "B_OU",
		"W_FU", "W_TO", "W_KY", "W_NY", "W_KE", "W_NK", "W_GI", "W_NG", "W_KI", "W_KA", "W_UM", "W_HI", "W_RY", "W_OU",
	}
	for _, label := range targetLabels {
		num, err := datastore.NewQuery(common.KindImage).Filter("Label =", label).Count(ctx)
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
