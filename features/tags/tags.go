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
