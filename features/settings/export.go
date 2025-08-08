package settings

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"zen/commons/utils"
	"zen/features/images"
	"zen/features/notes"
	"zen/features/tags"
)

type ExportMetadata struct {
	ExportDate time.Time `json:"exportDate"`
	NotesCount int       `json:"notesCount"`
	TagsCount  int       `json:"tagsCount"`
	AppName    string    `json:"appName"`
	AppVersion string    `json:"appVersion"`
}

type ExportNote struct {
	NoteID     int       `json:"noteId"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	Tags       []string  `json:"tags"`
	IsArchived bool      `json:"isArchived"`
	IsDeleted  bool      `json:"isDeleted"`
}

func HandleExport(w http.ResponseWriter, r *http.Request) {
	allNotes, err := getAllNotesForExport()
	if err != nil {
		err = fmt.Errorf("error fetching notes for export: %w", err)
		utils.SendErrorResponse(w, "EXPORT_FAILED", "Error exporting notes", err, http.StatusInternalServerError)
		return
	}

	allTags, err := tags.GetAllTags()
	if err != nil {
		err = fmt.Errorf("error fetching tags for export: %w", err)
		utils.SendErrorResponse(w, "EXPORT_FAILED", "Error exporting notes", err, http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("zen-export-%s.zip", time.Now().Format("2006-01-02-150405"))

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	err = createMetadataFile(zipWriter, len(allNotes), len(allTags))
	if err != nil {
		slog.Error("Error creating metadata file", "error", err)
		return
	}

	err = createMarkdownFiles(zipWriter, allNotes)
	if err != nil {
		slog.Error("Error creating markdown files", "error", err)
		return
	}

	err = createNotesJSONFile(zipWriter, allNotes)
	if err != nil {
		slog.Error("Error creating notes JSON file", "error", err)
		return
	}

	err = createTagsJSONFile(zipWriter, allTags)
	if err != nil {
		slog.Error("Error creating tags JSON file", "error", err)
		return
	}

	err = createImagesFolder(zipWriter, allNotes)
	if err != nil {
		slog.Error("Error creating images folder", "error", err)
		return
	}
}

func getAllNotesForExport() ([]notes.Note, error) {
	allNotes := []notes.Note{}

	activeNotes, err := getAllNotesByStatus(false)
	if err != nil {
		return nil, fmt.Errorf("error fetching active notes: %w", err)
	}
	allNotes = append(allNotes, activeNotes...)

	archivedNotes, err := getAllNotesByStatus(true)
	if err != nil {
		return nil, fmt.Errorf("error fetching archived notes: %w", err)
	}
	allNotes = append(allNotes, archivedNotes...)

	return allNotes, nil
}

func getAllNotesByStatus(isArchived bool) ([]notes.Note, error) {
	allNotes := []notes.Note{}
	page := 1

	for {
		filter := notes.NewNotesFilter(page, 0, 0, false, isArchived)
		pageNotes, total, err := notes.GetAllNotes(filter)
		if err != nil {
			return nil, fmt.Errorf("error fetching notes for page %d: %w", page, err)
		}

		allNotes = append(allNotes, pageNotes...)

		if len(allNotes) >= total || len(pageNotes) == 0 {
			break
		}

		page++
	}

	return allNotes, nil
}

func createMetadataFile(zipWriter *zip.Writer, notesCount, tagsCount int) error {
	metadata := ExportMetadata{
		ExportDate: time.Now(),
		NotesCount: notesCount,
		TagsCount:  tagsCount,
		AppName:    "Zen",
		AppVersion: "1.0.0",
	}

	metadataJSON, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling metadata: %w", err)
	}

	metadataWriter, err := zipWriter.Create("metadata.json")
	if err != nil {
		return fmt.Errorf("error creating metadata file: %w", err)
	}

	_, err = metadataWriter.Write(metadataJSON)
	if err != nil {
		return fmt.Errorf("error writing metadata file: %w", err)
	}

	return nil
}

func createMarkdownFiles(zipWriter *zip.Writer, allNotes []notes.Note) error {
	for _, note := range allNotes {
		filename := sanitizeFilename(note.Title, note.NoteID) + ".md"

		if note.IsArchived {
			filename = "archived/" + filename
		}

		noteWriter, err := zipWriter.Create(filename)
		if err != nil {
			return fmt.Errorf("error creating note file %s: %w", filename, err)
		}

		var tagStrings []string
		for _, tag := range note.Tags {
			tagStrings = append(tagStrings, tag.Name)
		}

		frontmatter := ""
		if len(tagStrings) > 0 {
			frontmatter = fmt.Sprintf("---\ntags: [%s]\n---\n\n", strings.Join(tagStrings, ", "))
		}

		content := frontmatter + note.Content

		_, err = noteWriter.Write([]byte(content))
		if err != nil {
			return fmt.Errorf("error writing note file %s: %w", filename, err)
		}
	}

	return nil
}

func createNotesJSONFile(zipWriter *zip.Writer, allNotes []notes.Note) error {
	var exportNotes []ExportNote

	for _, note := range allNotes {
		var tagNames []string
		for _, tag := range note.Tags {
			tagNames = append(tagNames, tag.Name)
		}

		exportNote := ExportNote{
			NoteID:     note.NoteID,
			Title:      note.Title,
			Content:    note.Content,
			UpdatedAt:  note.UpdatedAt,
			Tags:       tagNames,
			IsArchived: note.IsArchived,
			IsDeleted:  note.IsDeleted,
		}

		exportNotes = append(exportNotes, exportNote)
	}

	notesJSON, err := json.MarshalIndent(exportNotes, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling notes: %w", err)
	}

	notesWriter, err := zipWriter.Create("notes.json")
	if err != nil {
		return fmt.Errorf("error creating notes JSON file: %w", err)
	}

	_, err = notesWriter.Write(notesJSON)
	if err != nil {
		return fmt.Errorf("error writing notes JSON file: %w", err)
	}

	return nil
}

func createTagsJSONFile(zipWriter *zip.Writer, allTags []tags.Tag) error {
	tagsJSON, err := json.MarshalIndent(allTags, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling tags: %w", err)
	}

	tagsWriter, err := zipWriter.Create("tags.json")
	if err != nil {
		return fmt.Errorf("error creating tags JSON file: %w", err)
	}

	_, err = tagsWriter.Write(tagsJSON)
	if err != nil {
		return fmt.Errorf("error writing tags JSON file: %w", err)
	}

	return nil
}

func createImagesFolder(zipWriter *zip.Writer, allNotes []notes.Note) error {
	allImages, err := getAllImagesForExport()
	if err != nil {
		return fmt.Errorf("error fetching images for export: %w", err)
	}

	if len(allImages) == 0 {
		return nil
	}

	referencedImages := make(map[string]bool)
	imageRegex := regexp.MustCompile(`!\[.*?\]\(/images/([^)]+)\)`)

	for _, note := range allNotes {
		matches := imageRegex.FindAllStringSubmatch(note.Content, -1)
		for _, match := range matches {
			if len(match) > 1 {
				referencedImages[match[1]] = true
			}
		}
	}

	for _, image := range allImages {
		if !referencedImages[image.Filename] {
			continue
		}

		imagePath := filepath.Join("images", image.Filename)

		if _, err := os.Stat(imagePath); os.IsNotExist(err) {
			slog.Warn("Referenced image not found", "filename", image.Filename)
			continue
		}

		sourceFile, err := os.Open(imagePath)
		if err != nil {
			slog.Warn("Error opening image file", "filename", image.Filename, "error", err)
			continue
		}

		zipPath := "images/" + image.Filename
		imageWriter, err := zipWriter.Create(zipPath)
		if err != nil {
			sourceFile.Close()
			return fmt.Errorf("error creating image file %s in zip: %w", zipPath, err)
		}

		_, err = io.Copy(imageWriter, sourceFile)
		sourceFile.Close()
		if err != nil {
			return fmt.Errorf("error copying image file %s: %w", zipPath, err)
		}
	}

	return nil
}

func getAllImagesForExport() ([]images.Image, error) {
	allImages := []images.Image{}
	page := 1

	for {
		pageImages, total, err := getAllImagesByPage(page)
		if err != nil {
			return nil, fmt.Errorf("error fetching images for page %d: %w", page, err)
		}

		allImages = append(allImages, pageImages...)

		if len(allImages) >= total || len(pageImages) == 0 {
			break
		}

		page++
	}

	return allImages, nil
}

func getAllImagesByPage(page int) ([]images.Image, int, error) {
	filter := images.NewImagesFilter(page, 0, 0)
	return images.GetAllImages(filter)
}

func sanitizeFilename(title string, noteID int) string {
	if title == "" {
		return fmt.Sprintf("note-%d", noteID)
	}

	safe := regexp.MustCompile(`[^\w\-_\.]`).ReplaceAllString(title, "-")
	safe = strings.Trim(safe, "- ")
	safe = regexp.MustCompile(`-+`).ReplaceAllString(safe, "-")

	if len(safe) > 100 {
		safe = safe[:100]
	}

	if safe == "" || safe == "-" {
		safe = fmt.Sprintf("note-%d", noteID)
	}

	return safe
}
