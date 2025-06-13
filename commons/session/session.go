package session

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"
	"zen/commons/sqlite"
)

var sessionLength = time.Hour * 24 * 365 // 1 year
var expiresAtFormat = "2006-01-02T15:04:05-07:00"

type SessionRecord struct {
	SessionID string
	UserID    string
	ExpiresAt time.Time
}

func NewSession(userID string) (SessionRecord, error) {
	expiresAt := time.Now().Add(sessionLength)

	var session SessionRecord
	var expiresAtString string

	query := "INSERT INTO sessions (session_id, user_id, expires_at) VALUES (LOWER(HEX(RANDOMBLOB (16))), ?, ?) RETURNING session_id, user_id, expires_at"

	row := sqlite.DB.QueryRow(query, userID, expiresAt.Format(expiresAtFormat))
	err := row.Scan(&session.SessionID, &session.UserID, &expiresAtString)

	if err != nil {
		err = fmt.Errorf("error retrieving sessions: %w", err)
		slog.Error(err.Error())
		return session, err
	}

	session.ExpiresAt, err = time.Parse(expiresAtFormat, expiresAtString)

	if err != nil {
		err = fmt.Errorf("error parsing session expiry: %w", err)
		slog.Error(err.Error())
		return session, err
	}

	return session, nil
}

func SetSessionCookie(w http.ResponseWriter, session SessionRecord) {
	cookies := http.Cookie{Name: "session_token", Value: session.SessionID, Expires: session.ExpiresAt, Path: "/"}
	http.SetCookie(w, &cookies)
}

func IsValidSession(sessionID string) bool {
	query := "SELECT expires_at FROM sessions WHERE session_id = ?"
	var expiresAtString string

	row := sqlite.DB.QueryRow(query, sessionID)
	err := row.Scan(&expiresAtString)

	if errors.Is(err, sql.ErrNoRows) {
		return false
	}

	if err != nil {
		slog.Error("error retrieving sessions", "error", err)
		return false
	}

	expiresAt, err := time.Parse(expiresAtFormat, expiresAtString)

	if err != nil {
		slog.Error("error parsing session expiry", "error", err)
		return false
	}

	if expiresAt.Before(time.Now()) {
		return false
	}

	return true
}

func GetUserID(sessionID string) (string, error) {
	query := "SELECT user_id FROM sessions WHERE session_id = ?"
	var userID string

	row := sqlite.DB.QueryRow(query, sessionID)
	err := row.Scan(&userID)

	if err != nil {
		err = fmt.Errorf("error retrieving user session: %w", err)
		slog.Error(err.Error())
		return "", err
	}

	return userID, nil
}

func DeleteExpiredSessions() {
	query := "DELETE FROM sessions WHERE expires_at < ?"
	_, err := sqlite.DB.Exec(query, time.Now().Format(expiresAtFormat))

	if err != nil {
		slog.Error("error deleting expired sessions", "error", err)
	}
}
