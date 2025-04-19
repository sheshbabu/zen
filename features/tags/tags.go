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

	tags, err := GetTagsByName(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func HandleCreateTag(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name   string   `json:"name"`
		NoteID int      `json:"note_id"`
		TagIDs []string `json:"tag_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.NoteID == 0 {
		http.Error(w, "note_id is required", http.StatusBadRequest)
		return
	}

	tag, err := CreateTag(input.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var tags []Tag
	if input.TagIDs == nil {
		tags, err = AddNoteTag(input.NoteID, tag.TagID)
	} else {
		input.TagIDs = append(input.TagIDs, strconv.Itoa(tag.TagID))
		tags, err = UpdateNoteTags(input.NoteID, input.TagIDs)
	}

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
