package tags

import (
	"encoding/json"
	"net/http"
	"strconv"
)

type Tag struct {
	TagID int    `json:"tag_id"`
	Name  string `json:"name"`
}

func HandleGetTags(w http.ResponseWriter, r *http.Request) {
	var tags []Tag
	var err error

	query := r.URL.Query().Get("query")
	focusModeIDStr := r.URL.Query().Get("focus_id")

	focusModeID := 0
	if focusModeIDStr != "" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			http.Error(w, "Invalid focus mode ID", http.StatusBadRequest)
			return
		}
	}

	if focusModeID != 0 {
		tags, err = GetTagsByFocusModeID(focusModeID)
	} else if query != "" {
		tags, err = SearchTags(query)
	} else {
		tags, err = GetAllTags()
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func HandleUpdateTag(w http.ResponseWriter, r *http.Request) {
	var tag Tag
	if err := json.NewDecoder(r.Body).Decode(&tag); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := UpdateTag(tag); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleDeleteTag(w http.ResponseWriter, r *http.Request) {
	tagIDStr := r.PathValue("tag_id")
	tagID, err := strconv.Atoi(tagIDStr)
	if err != nil {
		http.Error(w, "Invalid tag ID", http.StatusBadRequest)
		return
	}

	if err := DeleteTag(tagID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
