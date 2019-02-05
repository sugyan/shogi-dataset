package entity

import (
	"context"
	"log"
	"reflect"
	"strings"

	"cloud.google.com/go/datastore"
)

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

type totalDiff bool

const (
	totalIncr totalDiff = true
	totalDecr totalDiff = false
)

type totalUpdate struct {
	label string
	diff  totalDiff
}

var totalKey = datastore.IDKey(KindTotal, 1, nil)

// GetTotal method
func (c *Client) GetTotal(ctx context.Context) (*Total, error) {
	total := &Total{}
	if err := c.dsClient.Get(ctx, totalKey, total); err != nil {
		if err == datastore.ErrNoSuchEntity {
			if _, err := c.dsClient.Put(ctx, totalKey, total); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return total, nil
}

// CountTotal method
func (c *Client) CountTotal(ctx context.Context) error {
	total := &Total{}
	targetLabels := []string{
		"BLANK",
		"B_FU", "B_TO", "B_KY", "B_NY", "B_KE", "B_NK", "B_GI", "B_NG", "B_KI", "B_KA", "B_UM", "B_HI", "B_RY", "B_OU",
		"W_FU", "W_TO", "W_KY", "W_NY", "W_KE", "W_NK", "W_GI", "W_NG", "W_KI", "W_KA", "W_UM", "W_HI", "W_RY", "W_OU",
	}
	for _, label := range targetLabels {
		query := datastore.NewQuery(KindImage).Filter("Label =", label)
		num, err := c.dsClient.Count(ctx, query)
		if err != nil {
			log.Printf("failed to count label %s: %s", label, err.Error())
			return err
		}
		fieldName := strings.Replace(label, "_", "", -1)
		reflect.Indirect(reflect.ValueOf(total)).FieldByName(fieldName).Set(reflect.ValueOf(num))
	}
	if _, err := c.dsClient.Put(ctx, totalKey, total); err != nil {
		return err
	}
	return nil
}

func (c *Client) updateTotal(ctx context.Context, updates ...*totalUpdate) error {
	if _, err := c.dsClient.RunInTransaction(ctx, func(tx *datastore.Transaction) error {
		total := &Total{}
		if err := tx.Get(totalKey, total); err != nil {
			return err
		}
		for _, update := range updates {
			fieldName := strings.Replace(update.label, "_", "", -1)
			fieldValue := reflect.Indirect(reflect.ValueOf(total)).FieldByName(fieldName)
			if num, ok := fieldValue.Interface().(int); ok {
				switch update.diff {
				case totalIncr:
					fieldValue.Set(reflect.ValueOf(num + 1))
				case totalDecr:
					fieldValue.Set(reflect.ValueOf(num - 1))
				}
			}
		}
		if _, err := tx.Put(totalKey, total); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}
	return nil
}
