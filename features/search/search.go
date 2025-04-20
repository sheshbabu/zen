package search

import (
	"encoding/json"
	"net/http"
	"zen/features/focus"
	"zen/features/notes"
	"zen/features/tags"
)

const LIMIT = 5

type result struct {
	Notes      []notes.Note      `json:"notes"`
	Tags       []tags.Tag        `json:"tags"`
	FocusModes []focus.FocusMode `json:"focusModes"`
}

func HandleSearch(w http.ResponseWriter, r *http.Request) {
	results := result{}

	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Invalid search query", http.StatusBadRequest)
		return
	}

	notes, err := notes.SearchNotes(query, LIMIT)
	if err != nil {
		http.Error(w, "error searching notes", http.StatusInternalServerError)
		return
	}
	results.Notes = notes

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}
