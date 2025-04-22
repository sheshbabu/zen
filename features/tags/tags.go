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
	query := r.URL.Query().Get("query")

	tags, err := SearchTags(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
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
