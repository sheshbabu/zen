package notes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"zen/commons/utils"
	"zen/features/tags"
)

type ResponseEnvelope struct {
	Notes []Note `json:"notes"`
	Total int    `json:"total"`
}

type Note struct {
	NoteID     int        `json:"noteId"`
	Title      string     `json:"title"`
	Snippet    string     `json:"snippet"`
	Content    string     `json:"content"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	Tags       []tags.Tag `json:"tags"`
	IsArchived bool       `json:"isArchived"`
	IsDeleted  bool       `json:"isDeleted"`
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
	tagIDStr := r.URL.Query().Get("tagId")
	focusModeIDStr := r.URL.Query().Get("focusId")
	isDeleted := r.URL.Query().Get("isDeleted")
	isArchived := r.URL.Query().Get("isArchived")

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
			utils.SendErrorResponse(w, "INVALID_PAGE_NUMBER", err, http.StatusBadRequest)
			return
		}
	}

	if tagIDStr != "" {
		tagID, err = strconv.Atoi(tagIDStr)
		filter.tagID = tagID
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_TAG_ID", err, http.StatusBadRequest)
			return
		}
	}

	if focusModeIDStr != "" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		filter.focusModeID = focusModeID
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_FOCUS_ID", err, http.StatusBadRequest)
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
		utils.SendErrorResponse(w, "NOTES_READ_FAILED", err, http.StatusInternalServerError)
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
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	note, err := GetNoteByID(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_READ_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleCreateNote(w http.ResponseWriter, r *http.Request) {
	var noteInput Note
	if err := json.NewDecoder(r.Body).Decode(&noteInput); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", err, http.StatusBadRequest)
		return
	}

	note, err := CreateNote(noteInput)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_CREATE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleUpdateNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	var noteInput Note
	if err := json.NewDecoder(r.Body).Decode(&noteInput); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", err, http.StatusBadRequest)
		return
	}
	noteInput.NoteID = noteID

	note, err := UpdateNote(noteInput)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_UPDATE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleForceDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	err = ForceDeleteNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_FORCE_DELETE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleSoftDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	err = SoftDeleteNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_SOFT_DELETE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleRestoreDeletedNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	err = RestoreDeletedNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_RESTORE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleArchiveNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	err = ArchiveNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_ARCHIVE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleUnarchiveNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", err, http.StatusBadRequest)
		return
	}

	err = UnarchiveNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_UNARCHIVE_FAILED", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
