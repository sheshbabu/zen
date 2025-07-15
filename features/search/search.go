package search

import (
	"encoding/json"
	"net/http"
	"zen/commons/utils"
	"zen/features/notes"
	"zen/features/tags"
)

const LIMIT = 20

type SearchResults struct {
	Notes []notes.Note `json:"notes"`
	Tags  []tags.Tag   `json:"tags"`
}

func HandleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		utils.SendErrorResponse(w, "INVALID_SEARCH_QUERY", "Search query is required", nil, http.StatusBadRequest)
		return
	}

	searchNotes, err := notes.SearchNotes(query, LIMIT)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_SEARCH_FAILED", "Error searching notes.", err, http.StatusInternalServerError)
		return
	}

	searchTags, err := tags.SearchTags(query)
	if err != nil {
		utils.SendErrorResponse(w, "TAGS_SEARCH_FAILED", "Error searching tags.", err, http.StatusInternalServerError)
		return
	}

	results := SearchResults{
		Notes: searchNotes,
		Tags:  searchTags,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}
