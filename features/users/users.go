package users

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"strings"
	"zen/commons/session"
	"zen/commons/utils"
)

type UserRecord struct {
	UserID   string `json:"userId"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type PasswordUpdateRecord struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func HandleCheckUser(w http.ResponseWriter, r *http.Request) {
	hasUsers := HasUsers()

	if !hasUsers {
		utils.SendErrorResponse(w, "NO_USERS", nil, http.StatusUnauthorized)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil && errors.Is(err, http.ErrNoCookie) {
		utils.SendErrorResponse(w, "NO_SESSION", err, http.StatusUnauthorized)
		return
	}

	sessionID := cookie.Value
	userID, err := session.GetUserID(sessionID)
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		utils.SendErrorResponse(w, "NO_SESSION", err, http.StatusUnauthorized)
		return
	}

	_, err = GetUserByID(userID)
	if err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleCreateUser(w http.ResponseWriter, r *http.Request) {
	var payload UserRecord
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !isValidEmail(payload.Email) {
		utils.SendErrorResponse(w, "INVALID_EMAIL", nil, http.StatusBadRequest)
		return
	}

	if !isValidPassword(payload.Password) {
		utils.SendErrorResponse(w, "INVALID_PASSWORD", nil, http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(payload.Password)
	if err != nil {
		err = fmt.Errorf("error hashing password: %w", err)
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	hasUsers := HasUsers()
	if hasUsers {
		err = fmt.Errorf("can't create more than one user: %w", err)
		utils.SendErrorResponse(w, "", err, http.StatusBadRequest)
		return
	}

	user, err := InsertUser(payload.Email, passwordHash, true)
	if err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	s, err := session.NewSession(user.UserID)
	if err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}
	session.SetSessionCookie(w, s)

	w.WriteHeader(http.StatusOK)
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	var payload UserRecord
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusBadRequest)
		return
	}

	user, err := GetUserByEmail(payload.Email)
	if errors.Is(err, sql.ErrNoRows) {
		utils.SendErrorResponse(w, "INCORRECT_EMAIL", err, http.StatusBadRequest)
		return
	}
	if err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	if !VerifyPassword(payload.Password, user.Password) {
		utils.SendErrorResponse(w, "INCORRECT_PASSWORD", err, http.StatusBadRequest)
		return
	}

	sess, err := session.NewSession(user.UserID)
	if err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	session.SetSessionCookie(w, sess)

	w.WriteHeader(http.StatusOK)
}

func HandleUpdatePassword(w http.ResponseWriter, r *http.Request) {
	var payload PasswordUpdateRecord
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.SendErrorResponse(w, "", err, http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil && errors.Is(err, http.ErrNoCookie) {
		utils.SendErrorResponse(w, "NO_SESSION", err, http.StatusUnauthorized)
		return
	}

	sessionID := cookie.Value
	userID, err := session.GetUserID(sessionID)
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		utils.SendErrorResponse(w, "NO_SESSION", err, http.StatusUnauthorized)
		return
	}

	user, err := GetUserByID(userID)
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		utils.SendErrorResponse(w, "NO_SESSION", err, http.StatusUnauthorized)
		return
	}

	if !VerifyPassword(payload.OldPassword, user.Password) {
		utils.SendErrorResponse(w, "INCORRECT_OLD_PASSWORD", nil, http.StatusBadRequest)
		return
	}

	if payload.OldPassword == payload.NewPassword {
		utils.SendErrorResponse(w, "INVALID_NEW_PASSWORD", nil, http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(payload.NewPassword)
	if err != nil {
		err = fmt.Errorf("error hashing password: %w", err)
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	err = UpdatePassword(userID, passwordHash)
	if err != nil {
		err = fmt.Errorf("error updating password: %w", err)
		utils.SendErrorResponse(w, "", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func isValidPassword(password string) bool {
	return len(strings.TrimSpace(password)) > 0
}
