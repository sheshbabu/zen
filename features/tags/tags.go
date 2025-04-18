package tags

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type Tag struct {
	TagID int    `json:"tag_id"`
	Name  string `json:"name"`
}

func HandleTags(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")

	if r.Header.Get("HX-Request") == "true" {
		HandleSidebarTagsListFragment(w)
		return
	}

	tags, err := GetTagsByName(query)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tags)
}

func HandleCreateTag(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()

	name := r.FormValue("name")
	noteIDStr := r.FormValue("note_id")
	tagIDs := r.Form["tag_ids"]

	if noteIDStr == "" {
		err := fmt.Errorf("error creating tag: note_id absent")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tag, err := CreateTag(name)
	if err != nil {
		err = fmt.Errorf("error creating tag: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var tags []Tag
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		err = fmt.Errorf("error parsing request: %w", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if tagIDs == nil {
		tags, err = AddNoteTag(noteID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error adding note tag: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		tagIDs = append(tagIDs, strconv.Itoa(tag.TagID))
		tags, err = UpdateNoteTags(noteID, tagIDs)
		if err != nil {
			err = fmt.Errorf("error updating note tags: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("HX-Trigger", "note_changed")
	RenderNoteEditorTagsComponent(w, tags)
}

func HandleUpdateNoteTags(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		err = fmt.Errorf("error parsing request: %w", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	r.ParseForm()

	tagIDs := r.Form["tag_ids"]
	tags, err := UpdateNoteTags(noteID, tagIDs)
	if err != nil {
		err = fmt.Errorf("error updating note tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("HX-Trigger", "note_changed")
	RenderNoteEditorTagsComponent(w, tags)
}

func HandleSidebarTagsListFragment(w http.ResponseWriter) {
	allTags, err := GetAllTags()
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	renderSidebarTagsListFragment(w, allTags)
}

func HandleDeleteTag(w http.ResponseWriter, r *http.Request) {
	tagIDStr := r.PathValue("tag_id")
	tagID, err := strconv.Atoi(tagIDStr)
	if err != nil {
		err = fmt.Errorf("error parsing request: %w", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = DeleteTag(tagID)
	if err != nil {
		err = fmt.Errorf("error deleting tag: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("HX-Trigger", "note_changed")
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

func HandleCreateTagV2(w http.ResponseWriter, r *http.Request) {
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

func HandleDeleteTagV2(w http.ResponseWriter, r *http.Request) {
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
