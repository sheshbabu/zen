package search

import (
	"encoding/json"
	"net/http"
	"zen/commons/utils"
	"zen/features/notes"
)

const LIMIT = 20

func HandleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		utils.SendErrorResponse(w, "INVALID_SEARCH_QUERY", nil, http.StatusBadRequest)
		return
	}

	notes, err := notes.SearchNotes(query, LIMIT)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_SEARCH_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notes)
}
