package search

import (
	"encoding/json"
	"net/http"
	"zen/features/notes"
)

const LIMIT = 20

func HandleSearch(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notes)
}
