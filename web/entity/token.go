package entity

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"time"

	"cloud.google.com/go/datastore"
	"google.golang.org/api/iterator"
)

// Token type
type Token struct {
	User      *datastore.Key
	CreatedAt time.Time
}

// GetToken method
func (c *Client) GetToken(ctx context.Context, token string) (*Token, error) {
	t := &Token{}
	if err := c.dsClient.Get(ctx, datastore.NameKey(KindToken, token, nil), t); err != nil {
		return nil, err
	}
	return t, nil
}

// FetchTokens method
func (c *Client) FetchTokens(ctx context.Context, userID int64) ([]*datastore.Key, error) {
	userKey := datastore.IDKey(KindUser, userID, nil)
	q := datastore.NewQuery(KindToken).Filter("User =", userKey)
	iter := c.dsClient.Run(ctx, q)
	results := []*datastore.Key{}
	for {
		token := &Token{}
		key, err := iter.Next(token)
		if err != nil {
			if err != iterator.Done {
				return nil, err
			}
			break
		}
		results = append(results, key)
	}
	return results, nil
}

// GenerateToken method
func (c *Client) GenerateToken(ctx context.Context, userID int64) (*datastore.Key, error) {
	var result *datastore.Key
	userKey := datastore.IDKey(KindUser, userID, nil)
	if _, err := c.dsClient.RunInTransaction(ctx, func(tx *datastore.Transaction) error {
		// delete existing tokens
		keys, err := c.FetchTokens(ctx, userID)
		if err != nil {
			return err
		}
		c.dsClient.DeleteMulti(ctx, keys)
		// create new token
		token := &Token{
			CreatedAt: time.Now(),
			User:      userKey,
		}
		name, err := randomString(32)
		if err != nil {
			return err
		}
		result, err = c.dsClient.Put(ctx, datastore.NameKey(KindToken, name, nil), token)
		if err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return result, nil
}

func randomString(size int) (string, error) {
	b := make([]byte, size)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.RawStdEncoding.EncodeToString(b), nil
}
