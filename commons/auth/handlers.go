package auth

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"zen/commons/session"
	"zen/commons/utils"
	"zen/features/users"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// HandleCheckUser verifies if a user is authenticated
func HandleCheckUser(w http.ResponseWriter, r *http.Request) {
	hasUsers := users.HasUsers()

	if !hasUsers {
		utils.SendErrorResponse(w, "NO_USERS", "No users found", nil, http.StatusUnauthorized)
		return
	}

	sessionID, err := GetSessionFromRequest(r)
	if err != nil {
		utils.SendErrorResponse(w, "NO_SESSION", "Session not found", err, http.StatusUnauthorized)
		return
	}

	userID, err := session.GetUserID(sessionID)
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		utils.SendErrorResponse(w, "NO_SESSION", "Session not found", err, http.StatusUnauthorized)
		return
	}
	if err != nil {
		utils.SendErrorResponse(w, "SESSION_READ_FAILED", "Failed to read session", err, http.StatusInternalServerError)
		return
	}

	_, err = users.GetUserByID(userID)
	if err != nil {
		utils.SendErrorResponse(w, "USER_READ_FAILED", "Failed to read user", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleLogin authenticates a user and creates a session
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	var payload LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	user, err := users.GetUserByEmail(payload.Email)
	if errors.Is(err, sql.ErrNoRows) {
		utils.SendErrorResponse(w, "INCORRECT_EMAIL", "Incorrect email address", err, http.StatusBadRequest)
		return
	}
	if err != nil {
		utils.SendErrorResponse(w, "USER_READ_FAILED", "Failed to read user", err, http.StatusInternalServerError)
		return
	}

	if !users.VerifyPassword(payload.Password, user.Password) {
		err = fmt.Errorf("incorrect password for user %s", payload.Email)
		slog.Error(err.Error())
		utils.SendErrorResponse(w, "INCORRECT_PASSWORD", "Incorrect password", err, http.StatusBadRequest)
		return
	}

	sess, err := session.NewSession(user.UserID)
	if err != nil {
		utils.SendErrorResponse(w, "SESSION_CREATE_FAILED", "Failed to create session", err, http.StatusInternalServerError)
		return
	}

	session.SetSessionCookie(w, sess)

	w.WriteHeader(http.StatusOK)
}

// HandleLogout destroys the user's session
func HandleLogout(w http.ResponseWriter, r *http.Request) {
	sessionID, err := GetSessionFromRequest(r)
	if err != nil {
		utils.SendErrorResponse(w, "NO_SESSION", "Session not found", err, http.StatusUnauthorized)
		return
	}

	err = session.DeleteSession(sessionID)
	if err != nil {
		utils.SendErrorResponse(w, "LOGOUT_FAILED", "Failed to logout", err, http.StatusInternalServerError)
		return
	}

	ClearSessionCookie(w)

	w.WriteHeader(http.StatusOK)
}

// HandleCreateUser creates a new user account (signup/onboarding)
func HandleCreateUser(w http.ResponseWriter, r *http.Request) {
	var payload LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if !IsValidEmail(payload.Email) {
		utils.SendErrorResponse(w, "INVALID_EMAIL", "Invalid email address", nil, http.StatusBadRequest)
		return
	}

	if !IsValidPassword(payload.Password) {
		utils.SendErrorResponse(w, "INVALID_PASSWORD", "Invalid password", nil, http.StatusBadRequest)
		return
	}

	passwordHash, err := users.HashPassword(payload.Password)
	if err != nil {
		err = fmt.Errorf("error hashing password: %w", err)
		utils.SendErrorResponse(w, "PASSWORD_HASH_FAILED", "Failed to process password", err, http.StatusInternalServerError)
		return
	}

	hasUsers := users.HasUsers()
	if hasUsers {
		err = fmt.Errorf("can't create more than one user")
		slog.Error(err.Error())
		utils.SendErrorResponse(w, "USER_CREATE_FAILED", "User already exists", err, http.StatusBadRequest)
		return
	}

	user, err := users.InsertUser(payload.Email, passwordHash, true)
	if err != nil {
		utils.SendErrorResponse(w, "USER_CREATE_FAILED", "Failed to create user", err, http.StatusInternalServerError)
		return
	}

	s, err := session.NewSession(user.UserID)
	if err != nil {
		utils.SendErrorResponse(w, "SESSION_CREATE_FAILED", "Failed to create session", err, http.StatusInternalServerError)
		return
	}
	session.SetSessionCookie(w, s)

	w.WriteHeader(http.StatusOK)
}
