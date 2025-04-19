package focus

import (
	"encoding/json"
	"net/http"
	"time"
)

type FocusMode struct {
	FocusModeID int
	Name        string
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
