package notes

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	"zen/features/tags"
)

type Note struct {
	NoteID    int
	Title     string
	Snippet   string
	Content   string
	UpdatedAt time.Time
	Tags      []tags.Tag
}

type Editor struct {
	SelectedNote Note
	IsNewNote    bool
}

type NotesList struct {
	Title       string
	Notes       []Note
	RefreshLink string
}

const NOTES_LIMIT = 100

func HandleNotesPage(w http.ResponseWriter, r *http.Request) {
	selectedNoteIDStr := r.PathValue("note_id")
	tagIDStr := r.URL.Query().Get("tag_id")

	if r.Header.Get("HX-Request") == "true" {
		// Editor Fragment
		if selectedNoteIDStr != "" {
			HandleNoteEditorFragment(w, r)
			return
		}
		// List Fragment
		if r.URL.Path == "/notes" || r.URL.Path == "/notes/" {
			HandleNotesListFragment(w, r)
			return
		}
	}

	var selectedNote Note
	var allNotes []Note
	var err error

	isNewNote := false

	if tagIDStr == "" {
		allNotes, err = GetAllNotes(NOTES_LIMIT, 0)
		if err != nil {
			err = fmt.Errorf("error retrieving notes: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		tagID, err := strconv.Atoi(tagIDStr)
		if err != nil {
			err = fmt.Errorf("error parsing tag ID: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		allNotes, err = GetNotesByTagID(tagID)
		if err != nil {
			err = fmt.Errorf("error retrieving notes: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	err = assignTagsToNotes(allNotes)
	if err != nil {
		err = fmt.Errorf("error assigning notes with tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(allNotes) == 0 {
		allTags := []tags.Tag{}
		isNewNote = true
		renderNotesPage(w, allTags, allNotes, selectedNote, isNewNote)
		return
	}

	if selectedNoteIDStr == "new" {
		selectedNote, err = CreateEmptyNote()
		if err != nil {
			err = fmt.Errorf("error retrieving note: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		isNewNote = true
	} else {
		selectedNoteID, err := strconv.Atoi(selectedNoteIDStr)
		if err != nil {
			selectedNote = allNotes[0]
		} else {
			selectedNote, err = GetNoteByID(selectedNoteID)
			if err != nil {
				err = fmt.Errorf("error retrieving note: %w", err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		selectedNote.Tags, err = tags.GetNoteTags(selectedNote.NoteID)
		if err != nil {
			err = fmt.Errorf("error retrieving note tags: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	allTags, err := tags.GetAllTags()
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	renderNotesPage(w, allTags, allNotes, selectedNote, isNewNote)
}

func HandleCreateNote(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()

	note := Note{
		Title:   r.FormValue("title"),
		Content: r.FormValue("content"),
	}

	note, err := CreateNote(note)
	if err != nil {
		err = fmt.Errorf("error creating note: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	editorData := Editor{
		SelectedNote: note,
		IsNewNote:    false,
	}

	w.Header().Set("HX-Redirect", fmt.Sprintf("/notes/%d", note.NoteID))
	w.Header().Set("HX-Trigger", "note_changed")
	renderNoteEditorFragment(w, editorData)
}

func HandleUpdateNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		err = fmt.Errorf("error parsing request: %w", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	r.ParseForm()

	note := Note{
		NoteID:  noteID,
		Title:   r.FormValue("title"),
		Content: r.FormValue("content"),
	}

	note, err = UpdateNote(note)
	if err != nil {
		err = fmt.Errorf("error updating note: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	note.Tags, err = tags.GetNoteTags(note.NoteID)
	if err != nil {
		err = fmt.Errorf("error retrieving note tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	editorData := Editor{
		SelectedNote: note,
		IsNewNote:    false,
	}

	w.Header().Set("HX-Trigger", "note_changed")
	renderNoteEditorFragment(w, editorData)
}

func HandleNoteEditorFragment(w http.ResponseWriter, r *http.Request) {
	var selectedNote Note
	var err error

	isNewNote := false
	selectedNoteIDStr := r.PathValue("note_id")

	if selectedNoteIDStr == "new" {
		selectedNote, err = CreateEmptyNote()
		if err != nil {
			err = fmt.Errorf("error retrieving note: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		isNewNote = true
	} else {
		selectedNoteID, err := strconv.Atoi(selectedNoteIDStr)
		if err != nil {
			err = fmt.Errorf("error retrieving note: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		selectedNote, err = GetNoteByID(selectedNoteID)
		if err != nil {
			err = fmt.Errorf("error retrieving note: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		selectedNote.Tags, err = tags.GetNoteTags(selectedNote.NoteID)
		if err != nil {
			err = fmt.Errorf("error retrieving note tags: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	editorData := Editor{
		SelectedNote: selectedNote,
		IsNewNote:    isNewNote,
	}

	renderNoteEditorFragment(w, editorData)
}

func HandleNotesListFragment(w http.ResponseWriter, r *http.Request) {
	var allNotes []Note
	var err error

	title := "Notes"
	fragmentSelfRefreshLink := "/notes"

	tagIDStr := r.URL.Query().Get("tag_id")

	if tagIDStr == "" {
		allNotes, err = GetAllNotes(NOTES_LIMIT, 0)
		if err != nil {
			err = fmt.Errorf("error retrieving notes: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		tagID, err := strconv.Atoi(tagIDStr)
		if err != nil {
			err = fmt.Errorf("error parsing tag ID: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		allNotes, err = GetNotesByTagID(tagID)
		if err != nil {
			err = fmt.Errorf("error retrieving notes: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		tag, err := tags.GetTagByID(tagID)
		if err != nil {
			err = fmt.Errorf("error retrieving tag: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		title = tag.Name
		fragmentSelfRefreshLink = fmt.Sprintf("/notes?tag_id=%d", tagID)
	}

	err = assignTagsToNotes(allNotes)
	if err != nil {
		err = fmt.Errorf("error assigning notes with tags: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	renderNotesListFragment(w, allNotes, title, fragmentSelfRefreshLink)
}
