package notes

import (
	"encoding/json"
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

func HandleCreateNote(w http.ResponseWriter, r *http.Request) {
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

func HandleUpdateNote(w http.ResponseWriter, r *http.Request) {
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

func HandleDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	err = DeleteNote(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
