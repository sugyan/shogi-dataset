package app

import (
	"errors"
	"net/http"
)

type appError struct {
	err     error
	message string
}

var (
	errBadRequest = &appError{errors.New(http.StatusText(http.StatusBadRequest)), http.StatusText(http.StatusBadRequest)}
	errForbidden  = &appError{errors.New(http.StatusText(http.StatusForbidden)), http.StatusText(http.StatusForbidden)}
	errNotFound   = &appError{errors.New(http.StatusText(http.StatusNotFound)), http.StatusText(http.StatusNotFound)}
)
