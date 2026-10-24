package utils

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
)

var ErrNotFound = errors.New("not found")

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func SendJSON(w http.ResponseWriter, statusCode int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(value)
}

func SendErrorResponse(w http.ResponseWriter, code string, message string, err error, statusCode int) {
	if err != nil {
		slog.Error(err.Error())
	}

	if errors.Is(err, ErrNotFound) {
		statusCode = http.StatusNotFound
	}

	SendJSON(w, statusCode, ErrorResponse{Code: code, Message: message})
}
