package focus

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"
	"zen/commons/utils"
	"zen/features/tags"
)

type FocusMode struct {
	FocusModeID int        `json:"focusId"`
	Name        string     `json:"name"`
	Tags        []tags.Tag `json:"tags"`
	LastUsedAt  time.Time  `json:"lastUsedAt"`
}

func HandleGetAllFocusModes(w http.ResponseWriter, r *http.Request) {
	allFocusModes, err := GetAllFocusModes()
	if err != nil {
		utils.SendErrorResponse(w, "FOCUS_READ_FAILED", "Error fetching focus modes.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allFocusModes)
}

func HandleCreateFocusMode(w http.ResponseWriter, r *http.Request) {
	var focusMode FocusMode
	if err := json.NewDecoder(r.Body).Decode(&focusMode); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if err := isValid(focusMode); err != nil {
		utils.SendErrorResponse(w, "FOCUS_UPDATE_FAILED", err.Error(), err, http.StatusInternalServerError)
		return
	}

	if err := CreateFocusMode(&focusMode); err != nil {
		utils.SendErrorResponse(w, "FOCUS_CREATE_FAILED", "Error creating focus mode", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(focusMode)
}

func HandleUpdateFocusMode(w http.ResponseWriter, r *http.Request) {
	var focusMode FocusMode
	if err := json.NewDecoder(r.Body).Decode(&focusMode); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	if err := isValid(focusMode); err != nil {
		utils.SendErrorResponse(w, "FOCUS_UPDATE_FAILED", err.Error(), err, http.StatusInternalServerError)
		return
	}

	if err := UpdateFocusMode(&focusMode); err != nil {
		utils.SendErrorResponse(w, "FOCUS_UPDATE_FAILED", "Error updating focus mode", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(focusMode)
}

func HandleDeleteFocusMode(w http.ResponseWriter, r *http.Request) {
	focusIDStr := r.PathValue("focusId")
	focusID, err := strconv.Atoi(focusIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_FOCUS_ID", "Invalid focus ID", err, http.StatusBadRequest)
		return
	}

	if err := DeleteFocusMode(focusID); err != nil {
		utils.SendErrorResponse(w, "FOCUS_DELETE_FAILED", "Error deleting focus mode", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func isValid(focusMode FocusMode) error {
	if focusMode.Name == "" {
		message := "Focus name is required"
		return errors.New(message)
	}

	if len(focusMode.Tags) == 0 {
		message := "Atleast one tag is required"
		return errors.New(message)
	}

	return nil
}
