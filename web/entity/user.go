package entity

import (
	"context"

	"cloud.google.com/go/datastore"
)

// UserRole type
type UserRole string

// Constant values
const (
	RoleViewer UserRole = "viewer"
	RoleEditor UserRole = "editor"
)

// User type
type User struct {
	Name string
	Role UserRole
}

// GetUser method
func (c *Client) GetUser(ctx context.Context, id int64) (*User, error) {
	u := &User{}
	if err := c.dsClient.Get(ctx, datastore.IDKey(KindUser, id, nil), u); err != nil {
		return nil, err
	}
	return u, nil
}

// SaveUser method
func (c *Client) SaveUser(ctx context.Context, id int64, name string) (*User, error) {
	user := &User{}
	key := datastore.IDKey(KindUser, id, nil)
	if err := c.dsClient.Get(ctx, key, user); err != nil {
		if err != datastore.ErrNoSuchEntity {
			return nil, err
		}
		// default role
		user.Role = RoleViewer
	}
	// update
	user.Name = name
	key, err := c.dsClient.Put(ctx, key, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
