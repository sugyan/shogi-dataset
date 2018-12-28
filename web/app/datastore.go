package app

import (
// "context"
// "log"
// "reflect"
// "strings"
// "time"

// "cloud.google.com/go/datastore"
// "github.com/sugyan/shogi-dataset"
)

// func countTotal(ctx context.Context) error {
// 	total := &dataset.Total{}
// 	targetLabels := []string{
// 		"BLANK",
// 		"B_FU", "B_TO", "B_KY", "B_NY", "B_KE", "B_NK", "B_GI", "B_NG", "B_KI", "B_KA", "B_UM", "B_HI", "B_RY", "B_OU",
// 		"W_FU", "W_TO", "W_KY", "W_NY", "W_KE", "W_NK", "W_GI", "W_NG", "W_KI", "W_KA", "W_UM", "W_HI", "W_RY", "W_OU",
// 	}
// 	for _, label := range targetLabels {
// 		num, err := datastore.NewQuery(dataset.KindImage).Filter("Label =", label).Count(ctx)
// 		if err != nil {
// 			log.Printf("failed to count label %s: %s", label, err.Error())
// 			return err
// 		}
// 		fieldName := strings.Replace(label, "_", "", -1)
// 		reflect.Indirect(reflect.ValueOf(total)).FieldByName(fieldName).Set(reflect.ValueOf(num))
// 	}
// 	if _, err := datastore.Put(ctx, totalKey(ctx), total); err != nil {
// 		log.Printf("failed to put entity: %s", err.Error())
// 		return err
// 	}
// 	return nil
// }
