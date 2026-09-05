package settings

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"
	"zen/commons/utils"
	"zen/features/notes"
	"zen/features/tags"
)

type frontmatter struct {
	title     string
	tags      []string
	createdAt *time.Time
	updatedAt *time.Time
}

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

	path := r.FormValue("path")

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

	body, fm := extractFrontmatter(string(content))

	title := strings.TrimSuffix(handler.Filename, ext)
	if fm.title != "" {
		title = fm.title
	}

	tagNames := fm.tags
	if len(tagNames) == 0 {
		tagNames = extractTagNamesFromPath(path)
	}
	noteTags := resolveTags(tagNames)

	note := notes.Note{
		Title:   title,
		Content: body,
		Tags:    noteTags,
	}

	if fm.createdAt != nil && fm.updatedAt != nil {
		note.CreatedAt = *fm.createdAt
		note.UpdatedAt = *fm.updatedAt
	} else if fm.createdAt != nil {
		note.CreatedAt = *fm.createdAt
		note.UpdatedAt = *fm.createdAt
	} else if fm.updatedAt != nil {
		note.CreatedAt = *fm.updatedAt
		note.UpdatedAt = *fm.updatedAt
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

func extractFrontmatter(content string) (string, frontmatter) {
	content = strings.ReplaceAll(content, "\r\n", "\n")

	if !strings.HasPrefix(content, "---\n") {
		return content, frontmatter{}
	}

	end := strings.Index(content[4:], "\n---\n")
	if end == -1 {
		return content, frontmatter{}
	}

	block := content[4 : end+4]
	body := strings.TrimPrefix(content[end+9:], "\n")

	var fm frontmatter
	for _, line := range strings.Split(block, "\n") {
		key, value, found := strings.Cut(line, ":")
		if !found {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)

		switch key {
		case "title":
			if fm.title == "" {
				fm.title = value
			}
		case "tags":
			if len(fm.tags) == 0 {
				fm.tags = splitTags(value)
			}
		case "created":
			if fm.createdAt == nil {
				t, err := time.Parse(time.RFC3339, value)
				if err == nil {
					fm.createdAt = &t
				}
			}
		case "updated":
			if fm.updatedAt == nil {
				t, err := time.Parse(time.RFC3339, value)
				if err == nil {
					fm.updatedAt = &t
				}
			}
		}
	}

	return body, fm
}

func splitTags(value string) []string {
	var result []string
	for _, part := range strings.Split(value, ",") {
		tag := strings.TrimSpace(part)
		if tag != "" {
			result = append(result, tag)
		}
	}
	return result
}

func resolveTags(names []string) []tags.Tag {
	var result []tags.Tag
	for _, name := range names {
		existingTags, err := tags.SearchTags(name)
		if err == nil {
			for _, t := range existingTags {
				if t.Name == name {
					result = append(result, t)
					goto next
				}
			}
		}
		result = append(result, tags.Tag{TagID: -1, Name: name})
	next:
	}
	return result
}

func extractTagNamesFromPath(path string) []string {
	if path == "" {
		return nil
	}

	cleanPath := filepath.Clean(path)
	pathParts := strings.Split(cleanPath, string(filepath.Separator))

	var folders []string
	for i, part := range pathParts {
		if part != "" && i < len(pathParts)-1 {
			folders = append(folders, part)
		}
	}

	if len(folders) == 0 {
		return nil
	}

	return []string{folders[len(folders)-1]}
}
