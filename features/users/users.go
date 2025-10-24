package users

import (
	"encoding/json"
	"fmt"
	"net/http"
	"zen/commons/auth"
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

func HandleUpdatePassword(w http.ResponseWriter, r *http.Request) {
	var payload PasswordUpdateRecord
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	userID, err := auth.GetUserIDFromRequest(r)
	if err != nil {
		utils.SendErrorResponse(w, "NO_SESSION", "Session not found", err, http.StatusUnauthorized)
		return
	}

	user, err := GetUserByID(userID)
	if err != nil {
		utils.SendErrorResponse(w, "USER_READ_FAILED", "Failed to read user", err, http.StatusInternalServerError)
		return
	}

	if !VerifyPassword(payload.OldPassword, user.Password) {
		utils.SendErrorResponse(w, "INCORRECT_OLD_PASSWORD", "Incorrect old password", nil, http.StatusBadRequest)
		return
	}

	if payload.OldPassword == payload.NewPassword {
		utils.SendErrorResponse(w, "INVALID_NEW_PASSWORD", "New password must be different", nil, http.StatusBadRequest)
		return
	}

	passwordHash, err := HashPassword(payload.NewPassword)
	if err != nil {
		err = fmt.Errorf("error hashing password: %w", err)
		utils.SendErrorResponse(w, "PASSWORD_HASH_FAILED", "Failed to process password", err, http.StatusInternalServerError)
		return
	}

	err = UpdatePassword(userID, passwordHash)
	if err != nil {
		err = fmt.Errorf("error updating password: %w", err)
		utils.SendErrorResponse(w, "PASSWORD_UPDATE_FAILED", "Failed to update password", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
