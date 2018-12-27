package entity

import (
	"context"
	"log"

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

var totalKey = datastore.IDKey(KindTotal, 1, nil)

// GetTotal method
func (c *Client) GetTotal(ctx context.Context) (*Total, error) {
	total := &Total{}
	if err := c.dsClient.Get(ctx, totalKey, total); err != nil {
		if err == datastore.ErrNoSuchEntity {
			if _, err := c.dsClient.Put(ctx, totalKey, total); err != nil {
				log.Printf("failed to put entity: %s", err.Error())
				return nil, err
			}
		} else {
			log.Printf("failed to get entity: %s", err.Error())
			return nil, err
		}
	}
	return total, nil
}
