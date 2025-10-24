package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"zen/commons/session"
)

// GetSessionFromRequest extracts the session token from the request cookie
func GetSessionFromRequest(r *http.Request) (string, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return "", fmt.Errorf("session cookie not found: %w", err)
		}
		return "", fmt.Errorf("error reading session cookie: %w", err)
	}
	return cookie.Value, nil
}

// GetUserIDFromRequest extracts the user ID from the session in the request
func GetUserIDFromRequest(r *http.Request) (string, error) {
	sessionID, err := GetSessionFromRequest(r)
	if err != nil {
		return "", err
	}

	userID, err := session.GetUserID(sessionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", fmt.Errorf("session not found: %w", err)
		}
		return "", fmt.Errorf("error retrieving user from session: %w", err)
	}

	return userID, nil
}

// ValidateSession checks if the session in the request is valid
func ValidateSession(r *http.Request) error {
	sessionID, err := GetSessionFromRequest(r)
	if err != nil {
		return err
	}

	if !session.IsValidSession(sessionID) {
		return fmt.Errorf("invalid or expired session")
	}

	return nil
}

// ClearSessionCookie removes the session cookie from the response
func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})
}
