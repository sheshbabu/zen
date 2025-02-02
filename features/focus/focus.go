package focus

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	"zen/features/tags"
)

type FocusMode struct {
	FocusModeID int
	Name        string
	LastUsedAt  time.Time
}

func HandleFocusDialog(w http.ResponseWriter, r *http.Request) {
	focusModeIDStr := r.PathValue("focus_id")

	var focusModeID int
	var allTags []tags.Tag
	var selectedFocusMode FocusMode
	var err error

	isNewFocusMode := focusModeIDStr == "new"

	if !isNewFocusMode {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			err = fmt.Errorf("error parsing focus mode ID: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		selectedFocusMode, err = GetFocusModeByID(focusModeID)
		if err != nil {
			err = fmt.Errorf("error retrieving focus mode: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		allTags, err = tags.GetTagsByFocusModeID(focusModeID)
		if err != nil {
			err = fmt.Errorf("error retrieving tags: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	renderFocusDialog(w, selectedFocusMode, allTags)
}
