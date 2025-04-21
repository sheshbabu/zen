package focus

import (
	"encoding/json"
	"net/http"
	"time"
	"zen/features/tags"
)

type FocusMode struct {
	FocusModeID int
	Name        string
	Tags        []tags.Tag
	LastUsedAt  time.Time
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
