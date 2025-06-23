package settings

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"zen/commons/utils"
	"zen/features/notes"
)

func HandleImport(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // Max 10MB
	if err != nil {
		err = fmt.Errorf("error parsing file: %w", err)
		utils.SendErrorResponse(w, "INVALID_FILE", "Invalid file", err, http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		err = fmt.Errorf("error parsing file: %w", err)
		utils.SendErrorResponse(w, "INVALID_FILE", "Invalid file", err, http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".md" && ext != ".txt" {
		err = fmt.Errorf("unsupported file type: %s", ext)
		utils.SendErrorResponse(w, "INVALID_FILE_TYPE", "Only .md and .txt files are allowed", err, http.StatusBadRequest)
		return
	}

	content, err := io.ReadAll(file)
	if err != nil {
		err = fmt.Errorf("error reading file content: %w", err)
		utils.SendErrorResponse(w, "FILE_READ_FAILED", "Error reading file content", err, http.StatusInternalServerError)
		return
	}

	note := notes.Note{
		Title:   strings.TrimSuffix(handler.Filename, ext),
		Content: string(content),
	}

	_, err = notes.CreateNote(note)
	if err != nil {
		err = fmt.Errorf("error creating note: %w", err)
		utils.SendErrorResponse(w, "NOTES_IMPORT_FAILED", "Error importing note", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "File uploaded successfully"}`))
}
