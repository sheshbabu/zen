package notes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"zen/features/tags"
)

type ResponseEnvelope struct {
	Notes []Note `json:"notes"`
	Total int    `json:"total"`
}

type Note struct {
	NoteID     int
	Title      string
	Snippet    string
	Content    string
	UpdatedAt  time.Time
	Tags       []tags.Tag
	IsArchived bool
	IsDeleted  bool
}

type NotesFilter struct {
	page        int
	tagID       int
	focusModeID int
	isDeleted   bool
	isArchived  bool
}

func HandleGetNotes(w http.ResponseWriter, r *http.Request) {
	var allNotes []Note
	var err error
	var total int
	var filter NotesFilter

	pageStr := r.URL.Query().Get("page")
	tagIDStr := r.URL.Query().Get("tag_id")
	focusModeIDStr := r.URL.Query().Get("focus_id")
	isDeleted := r.URL.Query().Get("is_deleted")
	isArchived := r.URL.Query().Get("is_archived")

	page := 1
	tagID := 0
	focusModeID := 0
	filter = NotesFilter{
		page:        page,
		tagID:       tagID,
		focusModeID: focusModeID,
		isDeleted:   false,
		isArchived:  false,
	}

	if pageStr != "" {
		page, err = strconv.Atoi(pageStr)
		filter.page = page
		if err != nil {
			http.Error(w, "Invalid page number", http.StatusBadRequest)
			return
		}
	}

	if tagIDStr != "" {
		tagID, err = strconv.Atoi(tagIDStr)
		filter.tagID = tagID
		if err != nil {
			http.Error(w, "Invalid tag ID", http.StatusBadRequest)
			return
		}
	}

	if focusModeIDStr != "" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		filter.focusModeID = focusModeID
		if err != nil {
			http.Error(w, "Invalid focus mode ID", http.StatusBadRequest)
			return
		}
	}

	if isDeleted == "true" {
		filter.isDeleted = true
	} else if isArchived == "true" {
		filter.isArchived = true
	}

	if focusModeID == 0 && tagID == 0 {
		allNotes, total, err = GetAllNotes(filter)
	} else if tagID != 0 {
		allNotes, total, err = GetNotesByTagID(tagID, page)
	} else if focusModeID != 0 {
		allNotes, total, err = GetNotesByFocusModeID(focusModeID, page)
	} else if isDeleted == "true" {
		allNotes, total, err = GetAllNotes(filter)
	} else if isArchived == "true" {
		allNotes, total, err = GetAllNotes(filter)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := ResponseEnvelope{
		Notes: allNotes,
		Total: total,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleForceDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	err = ForceDeleteNote(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleSoftDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	err = SoftDeleteNote(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleRestoreDeletedNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	err = RestoreDeletedNote(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleArchiveNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	err = ArchiveNote(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleUnarchiveNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("note_id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	err = UnarchiveNote(noteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
