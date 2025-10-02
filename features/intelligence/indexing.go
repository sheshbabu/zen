package intelligence

import (
	"fmt"
	"log/slog"
	"zen/commons/queue"
	"zen/features/images"
	"zen/features/notes"
)

func indexAllNotes() (int, error) {
	var allNotes []notes.Note
	var page = 1
	var tasksAdded = 0

	for {
		filter := notes.NewNotesFilter(page, 0, 0, false, false) // Non-deleted, non-archived notes
		pageNotes, total, err := notes.GetAllNotes(filter)
		if err != nil {
			return 0, fmt.Errorf("failed to get notes page %d: %w", page, err)
		}

		allNotes = append(allNotes, pageNotes...)

		if len(allNotes) >= total || len(pageNotes) == 0 {
			break
		}
		page++
	}

	for _, note := range allNotes {
		_, err := queue.AddNoteTask(note.NoteID, queue.QUEUE_NOTE_PROCESS, "process")
		if err != nil {
			slog.Error("Failed to add note indexing task", "noteID", note.NoteID, "error", err)
			continue
		}
		tasksAdded++
	}

	return tasksAdded, nil
}

func indexAllImages() (int, error) {
	var allImages []images.Image
	var page = 1
	var tasksAdded = 0

	for {
		filter := images.NewImagesFilter(page, 0, 0)
		pageImages, total, err := images.GetAllImages(filter)
		if err != nil {
			return 0, fmt.Errorf("failed to get images page %d: %w", page, err)
		}

		allImages = append(allImages, pageImages...)

		if len(allImages) >= total || len(pageImages) == 0 {
			break
		}
		page++
	}

	for _, image := range allImages {
		_, err := queue.AddImageTask(image.Filename, queue.QUEUE_IMAGE_PROCESS, "process")
		if err != nil {
			slog.Error("Failed to add image indexing task", "filename", image.Filename, "error", err)
			continue
		}
		tasksAdded++
	}

	return tasksAdded, nil
}
