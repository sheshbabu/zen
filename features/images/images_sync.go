package images

import (
	"fmt"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"log/slog"
	"os"
	"path/filepath"
	"regexp"
	"zen/commons/queue"
	"zen/features/notes"
)

func SyncImagesFromDisk() error {
	slog.Info("starting image sync job")

	diskImages, err := scanImagesDirectory()
	if err != nil {
		err = fmt.Errorf("error scanning images directory: %w", err)
		slog.Error(err.Error())
		return err
	}

	dbImages, err := getAllDatabaseImages()
	if err != nil {
		err = fmt.Errorf("error retrieving database images: %w", err)
		slog.Error(err.Error())
		return err
	}

	notesWithImages, err := notes.GetNotesWithImages()
	if err != nil {
		err = fmt.Errorf("error getting notes with images: %w", err)
		slog.Error(err.Error())
		return err
	}

	noteImageRefs := extractImageReferencesFromNotes(notesWithImages)

	err = syncImageRecords(diskImages, dbImages, noteImageRefs)
	if err != nil {
		err = fmt.Errorf("error syncing image records: %w", err)
		slog.Error(err.Error())
		return err
	}

	slog.Info("image sync job completed")
	return nil
}

func scanImagesDirectory() (map[string]os.FileInfo, error) {
	diskImages := make(map[string]os.FileInfo)

	path := os.Getenv("IMAGES_FOLDER")
	if path == "" {
		path = "./images"
	}
	if _, err := os.Stat(path); os.IsNotExist(err) {
		slog.Warn("images directory does not exist", "path", path)
		return diskImages, nil
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, fmt.Errorf("error reading images directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filename := entry.Name()
		if isImageFile(filename) {
			info, err := entry.Info()
			if err != nil {
				continue
			}
			diskImages[filename] = info
		}
	}

	return diskImages, nil
}

func isImageFile(filename string) bool {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif":
		return true
	default:
		return false
	}
}

func getAllDatabaseImages() (map[string]Image, error) {
	dbImages := make(map[string]Image)

	allImages := []Image{}
	page := 1

	for {
		filter := NewImagesFilter(page, 0, 0)
		images, total, err := GetAllImages(filter)
		if err != nil {
			return nil, fmt.Errorf("error retrieving images: %w", err)
		}

		allImages = append(allImages, images...)

		if len(allImages) >= total {
			break
		}

		page++
	}

	for _, image := range allImages {
		dbImages[image.Filename] = image
	}

	return dbImages, nil
}

func extractImageReferencesFromNotes(notes []notes.Note) map[string][]int {
	noteImageRefs := make(map[string][]int)
	imageRegex := regexp.MustCompile(`!\[.*?\]\(/images/([^)]+)\)`)

	for _, note := range notes {
		matches := imageRegex.FindAllStringSubmatch(note.Content, -1)
		for _, match := range matches {
			if len(match) > 1 {
				filename := match[1]
				noteImageRefs[filename] = append(noteImageRefs[filename], note.NoteID)
			}
		}
	}

	return noteImageRefs
}

func syncImageRecords(diskImages map[string]os.FileInfo, dbImages map[string]Image, noteImageRefs map[string][]int) error {
	// If images exist inside notes and disk, but not in database, create them
	// Ensure that images referenced in notes are linked to the notes
	for filename, referencingNoteIds := range noteImageRefs {
		fileInfo, existsOnDisk := diskImages[filename]
		_, existsInDB := dbImages[filename]

		if existsOnDisk && !existsInDB {
			err := createImageRecordFromFile(filename, fileInfo)
			if err != nil {
				slog.Error("failed to create image record", "filename", filename, "error", err)
				continue
			}
			queue.AddImageTask(filename, queue.QUEUE_IMAGE_PROCESS, "process")
		}

		if existsOnDisk {
			err := ensureImageNoteLinks(referencingNoteIds, filename)
			if err != nil {
				slog.Error("failed to ensure image-note links", "filename", filename, "error", err)
			}
		} else {
			slog.Warn("image referenced in notes but missing in disk", "filename", filename, "referencingNotes", referencingNoteIds)
		}
	}

	// If images exist in database but not on disk, delete them
	for filename := range diskImages {
		referencingNoteIds := noteImageRefs[filename]
		if len(referencingNoteIds) == 0 {
			err := deleteImageFromFilesystem(filename)
			if err != nil {
				slog.Error("failed to delete unreferenced image in disk", "filename", filename, "error", err)
			} else {
				slog.Info("deleted unreferenced image in disk", "filename", filename)
			}
		}
	}

	// If images exist in database but not on disk and not referenced in notes, delete them
	for filename := range dbImages {
		_, existsOnDisk := diskImages[filename]
		referencingNoteIds := noteImageRefs[filename]

		if !existsOnDisk && len(referencingNoteIds) == 0 {
			err := DeleteImage(filename)
			if err != nil {
				slog.Error("failed to delete orphaned image", "filename", filename, "error", err)
			}
			queue.AddImageTask(filename, queue.QUEUE_IMAGE_DELETE, "delete")
		}
	}

	return nil
}

func createImageRecordFromFile(filename string, fileInfo os.FileInfo) error {
	filepath := filepath.Join("images", filename)
	file, err := os.Open(filepath)
	if err != nil {
		err = fmt.Errorf("error opening image file: %w", err)
		slog.Error(err.Error())
		return err
	}
	defer file.Close()

	imageInfo, err := getImageInfo(file)
	if err != nil {
		err = fmt.Errorf("error getting image info: %w", err)
		slog.Error(err.Error())
		return err
	}

	imageRecord := ImageRecord{
		Filename:    filename,
		Width:       imageInfo.Width,
		Height:      imageInfo.Height,
		Format:      imageInfo.Format,
		AspectRatio: imageInfo.AspectRatio,
		FileSize:    fileInfo.Size(),
		Caption:     nil,
	}

	_, err = CreateImage(imageRecord)
	if err != nil {
		err = fmt.Errorf("error creating image record: %w", err)
		slog.Error(err.Error())
		return err
	}

	slog.Info("inserted image into database", "filename", filename)
	return nil
}

func ensureImageNoteLinks(noteIDs []int, filename string) error {
	existingLinks, err := GetLinkedNotesByImage(filename)
	if err != nil {
		return err
	}

	for _, noteID := range noteIDs {
		if !contains(existingLinks, noteID) {
			err := LinkImageToNote(noteID, filename)
			if err != nil {
				err = fmt.Errorf("error linking image to note: %w", err)
				slog.Error(err.Error())
				return err
			}
		}
	}

	return nil
}

func contains(slice []int, item int) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func deleteImageFromFilesystem(filename string) error {
	path := os.Getenv("IMAGES_FOLDER")
	if path == "" {
		path = "./images"
	}

	filepath := filepath.Join(path, filename)

	if _, err := os.Stat(filepath); os.IsNotExist(err) {
		return nil
	}

	err := os.Remove(filepath)
	if err != nil {
		err = fmt.Errorf("error deleting image file %s: %w", filepath, err)
		slog.Error(err.Error())
		return err
	}

	return nil
}
