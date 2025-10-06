package notes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"zen/commons/queue"
	"zen/commons/utils"
	"zen/features/tags"
)

type ResponseEnvelope struct {
	Notes []Note `json:"notes"`
	Total int    `json:"total"`
}

type Note struct {
	NoteID             int        `json:"noteId"`
	Title              string     `json:"title"`
	Snippet            string     `json:"snippet"`
	Content            string     `json:"content"`
	HighlightedTitle   string     `json:"highlightedTitle,omitempty"`
	HighlightedContent string     `json:"highlightedContent,omitempty"`
	UpdatedAt          time.Time  `json:"updatedAt"`
	Tags               []tags.Tag `json:"tags"`
	IsArchived         bool       `json:"isArchived"`
	IsDeleted          bool       `json:"isDeleted"`
	IsPinned           bool       `json:"isPinned"`
}

type NotesFilter struct {
	page        int
	tagID       int
	focusModeID int
	isDeleted   bool
	isArchived  bool
}

func NewNotesFilter(page, tagID, focusModeID int, isDeleted, isArchived bool) NotesFilter {
	return NotesFilter{
		page:        page,
		tagID:       tagID,
		focusModeID: focusModeID,
		isDeleted:   isDeleted,
		isArchived:  isArchived,
	}
}

func HandleGetNotes(w http.ResponseWriter, r *http.Request) {
	var allNotes []Note
	var err error
	var total int

	pageStr := r.URL.Query().Get("page")
	tagIDStr := r.URL.Query().Get("tagId")
	focusModeIDStr := r.URL.Query().Get("focusId")
	isDeleted := r.URL.Query().Get("isDeleted")
	isArchived := r.URL.Query().Get("isArchived")

	page := 1
	tagID := 0
	focusModeID := 0

	if pageStr != "" {
		page, err = strconv.Atoi(pageStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_PAGE_NUMBER", "Invalid page number", err, http.StatusBadRequest)
			return
		}
	}

	if tagIDStr != "" {
		tagID, err = strconv.Atoi(tagIDStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_TAG_ID", "Invalid tag ID", err, http.StatusBadRequest)
			return
		}
	}

	if focusModeIDStr != "" {
		focusModeID, err = strconv.Atoi(focusModeIDStr)
		if err != nil {
			utils.SendErrorResponse(w, "INVALID_FOCUS_ID", "Invalid focus mode ID", err, http.StatusBadRequest)
			return
		}
	}

	filter := NotesFilter{
		page:        page,
		tagID:       tagID,
		focusModeID: focusModeID,
		isDeleted:   isDeleted == "true",
		isArchived:  isArchived == "true",
	}

	allNotes, total, err = GetAllNotes(filter)

	if err != nil {
		utils.SendErrorResponse(w, "NOTES_READ_FAILED", "Error fetching notes.", err, http.StatusInternalServerError)
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
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	note, err := GetNoteByID(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_READ_FAILED", "Error fetching note.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleCreateNote(w http.ResponseWriter, r *http.Request) {
	var noteInput Note
	if err := json.NewDecoder(r.Body).Decode(&noteInput); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}

	note, err := CreateNote(noteInput)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_CREATE_FAILED", "Error saving note.", err, http.StatusInternalServerError)
		return
	}

	queue.AddNoteTask(note.NoteID, queue.QUEUE_NOTE_PROCESS, "process")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleUpdateNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	var noteInput Note
	if err := json.NewDecoder(r.Body).Decode(&noteInput); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST_BODY", "Invalid request data", err, http.StatusBadRequest)
		return
	}
	noteInput.NoteID = noteID

	note, err := UpdateNote(noteInput)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_UPDATE_FAILED", "Error saving note.", err, http.StatusInternalServerError)
		return
	}

	queue.RemoveAllNoteTasks(noteID)
	queue.AddNoteTask(noteID, queue.QUEUE_NOTE_PROCESS, "process")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(note)
}

func HandleForceDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = ForceDeleteNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_FORCE_DELETE_FAILED", "Error deleting note.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleSoftDeleteNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = SoftDeleteNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_SOFT_DELETE_FAILED", "Error deleting note.", err, http.StatusInternalServerError)
		return
	}

	queue.RemoveAllNoteTasks(noteID)
	queue.AddNoteTask(noteID, queue.QUEUE_NOTE_DELETE, "delete")

	w.WriteHeader(http.StatusOK)
}

func HandleRestoreDeletedNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = RestoreDeletedNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_RESTORE_FAILED", "Error restoring note.", err, http.StatusInternalServerError)
		return
	}

	queue.RemoveAllNoteTasks(noteID)
	queue.AddNoteTask(noteID, queue.QUEUE_NOTE_PROCESS, "process")

	w.WriteHeader(http.StatusOK)
}

func HandleArchiveNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = ArchiveNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_ARCHIVE_FAILED", "Error archiving note.", err, http.StatusInternalServerError)
		return
	}

	queue.RemoveAllNoteTasks(noteID)
	queue.AddNoteTask(noteID, queue.QUEUE_NOTE_DELETE, "delete")

	w.WriteHeader(http.StatusOK)
}

func HandleUnarchiveNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = UnarchiveNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_UNARCHIVE_FAILED", "Error unarchiving note.", err, http.StatusInternalServerError)
		return
	}

	queue.RemoveAllNoteTasks(noteID)
	queue.AddNoteTask(noteID, queue.QUEUE_NOTE_PROCESS, "process")

	w.WriteHeader(http.StatusOK)
}

func HandlePinNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = PinNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_PIN_FAILED", "Error pinning note.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleUnpinNote(w http.ResponseWriter, r *http.Request) {
	noteIDStr := r.PathValue("noteId")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_NOTE_ID", "Invalid note ID", err, http.StatusBadRequest)
		return
	}

	err = UnpinNote(noteID)
	if err != nil {
		utils.SendErrorResponse(w, "NOTES_UNPIN_FAILED", "Error unpinning note.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func HandleDeleteNotes(w http.ResponseWriter, r *http.Request) {
	isDeleted := r.URL.Query().Get("isDeleted")

	if isDeleted == "true" {
		err := EmptyTrash(false)
		if err != nil {
			utils.SendErrorResponse(w, "TRASH_EMPTY_FAILED", "Error emptying trash.", err, http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
}
