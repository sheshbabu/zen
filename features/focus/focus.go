package focus

import (
	"encoding/json"
	"net/http"
	"time"
	"zen/features/tags"
)

type FocusMode struct {
	FocusModeID int        `json:"focus_mode_id"`
	Name        string     `json:"name"`
	Tags        []tags.Tag `json:"tags"`
	LastUsedAt  time.Time  `json:"last_used_at"`
}

func HandleGetAllFocusModes(w http.ResponseWriter, r *http.Request) {
	allFocusModes, err := GetAllFocusModes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allFocusModes)
}

func HandleCreateFocusMode(w http.ResponseWriter, r *http.Request) {
	var focusMode FocusMode
	if err := json.NewDecoder(r.Body).Decode(&focusMode); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := CreateFocusMode(&focusMode); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(focusMode)
}

func HandleUpdateFocusMode(w http.ResponseWriter, r *http.Request) {
	var focusMode FocusMode
	if err := json.NewDecoder(r.Body).Decode(&focusMode); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := UpdateFocusMode(&focusMode); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(focusMode)
}
