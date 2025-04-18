package notes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"zen/features/focus"
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
	IsHidden     bool
}

type NotesList struct {
	Title          string
	Notes          []Note
	RefreshLink    string
	ViewPreference string
}

type Sidebar struct {
	FocusModes []focus.FocusMode
	Tags       []tags.Tag
}

const NOTES_LIMIT = 100

func HandleNotesPage(w http.ResponseWriter, r *http.Request) {
	// Used for responsive design in server-side rendering
	page := "notes" // "editor", "tags", "search"

	selectedNoteIDStr := r.PathValue("note_id")
	tagIDStr := r.URL.Query().Get("tag_id")
	focusModeIDStr := r.URL.Query().Get("focus_id")

	if selectedNoteIDStr != "" {
		page = "editor"
	} else if r.URL.Path == "/notes" || r.URL.Path == "/notes/" {
		page = "notes"
	}

	if r.Header.Get("HX-Request") == "true" {
		if page == "editor" {
			HandleNoteEditorFragment(w, r)
			return
		}
		if page == "notes" {
			HandleNotesListFragment(w, r)
			return
		}
	}

	var selectedNote Note
	var allNotes []Note
	var allTags []tags.Tag
	var allFocusModes []focus.FocusMode
	var err error

	isNewNote := false
	viewPreference := "list"
	focusModeID := 0

	if focusModeIDStr != "" && focusModeIDStr != "0" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			err = fmt.Errorf("error parsing focus mode ID: %w", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	cookie, err := r.Cookie("listViewPreference")
	if err == nil {
		viewPreference = cookie.Value
	}

	if focusModeID == 0 && tagIDStr == "" {
		allNotes, err = GetAllNotes(NOTES_LIMIT, 0)
		if err != nil {
			err = fmt.Errorf("error retrieving notes: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else if tagIDStr != "" {
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
	} else if focusModeID != 0 && tagIDStr == "" {
		err = focus.UpdateFocusMode(focusModeID)
		if err != nil {
			err = fmt.Errorf("error updating focus mode: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		allNotes, err = GetNotesByFocusModeID(focusModeID)
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

	if focusModeID == 0 {
		allTags, err = tags.GetAllTags()
		if err != nil {
			err = fmt.Errorf("error retrieving tags: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		allTags, err = tags.GetTagsByFocusModeID(focusModeID)
		if err != nil {
			err = fmt.Errorf("error retrieving tags: %w", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	allFocusModes, err = focus.GetAllFocusModes()
	if err != nil {
		err = fmt.Errorf("error retrieving focus modes: %w", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(allNotes) == 0 {
		renderNotesPage(w, allTags, allNotes, allFocusModes, selectedNote, isNewNote, viewPreference, page)
		return
	}

	if selectedNoteIDStr == "new" {
		selectedNote, err = CreateEmptyNote()
		if err != nil {
			err = fmt.Errorf("error creating empty note: %w", err)
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

	renderNotesPage(w, allTags, allNotes, allFocusModes, selectedNote, isNewNote, viewPreference, page)
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
	viewPreference := "list"

	cookie, err := r.Cookie("listViewPreference")
	if err == nil {
		viewPreference = cookie.Value
	}

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

	renderNotesListFragment(w, allNotes, title, fragmentSelfRefreshLink, viewPreference)
}

func HandleGetNotes(w http.ResponseWriter, r *http.Request) {
	var allNotes []Note
	var err error

	tagIDStr := r.URL.Query().Get("tag_id")
	focusModeIDStr := r.URL.Query().Get("focus_id")
	focusModeID := 0

	if focusModeIDStr != "" && focusModeIDStr != "0" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			http.Error(w, "Invalid focus mode ID", http.StatusBadRequest)
			return
		}
	}

	if focusModeID == 0 && tagIDStr == "" {
		allNotes, err = GetAllNotes(NOTES_LIMIT, 0)
	} else if tagIDStr != "" {
		tagID, err := strconv.Atoi(tagIDStr)
		if err != nil {
			http.Error(w, "Invalid tag ID", http.StatusBadRequest)
			return
		}
		allNotes, err = GetNotesByTagID(tagID)
	} else {
		allNotes, err = GetNotesByFocusModeID(focusModeID)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = assignTagsToNotes(allNotes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allNotes)
}

func HandleGetNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	note, err := GetNoteByID(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	note.Tags, err = tags.GetNoteTags(note.NoteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleCreateNoteV2(w http.ResponseWriter, r *http.Request) {
	var noteInput Note
	if err := json.NewDecoder(r.Body).Decode(&noteInput); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	note, err := CreateNote(noteInput)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleUpdateNoteV2(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	var noteInput Note
	if err := json.NewDecoder(r.Body).Decode(&noteInput); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	noteInput.NoteID = noteID

	note, err := UpdateNote(noteInput)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	note.Tags, err = tags.GetNoteTags(note.NoteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleGetAllFocusModesV2(w http.ResponseWriter, r *http.Request) {
	allFocusModes, err := focus.GetAllFocusModes()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allFocusModes)
}
