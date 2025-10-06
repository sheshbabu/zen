package intelligence

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"sync"
	"time"
	"zen/commons/queue"
	"zen/features/images"
	"zen/features/notes"
)

var processingMutex sync.Mutex

func ProcessQueues() {
	if !processingMutex.TryLock() {
		slog.Info("intelligence queue processing already running, skipping")
		return
	}
	defer processingMutex.Unlock()

	if !isIntelligenceEnabled {
		queue.Clear()
	}

	// Process queues in priority order: deletions first, then additions
	// Deletion queues must be processed first because:
	// 1. When a note is deleted, RemoveAllTasksForNote() clears pending tasks but running tasks may still complete
	// 2. If PROCESS runs after a note is deleted, it wastes LLM resources on deleted content
	// 3. If DELETE runs after PROCESS, it correctly cleans up the embeddings
	// 4. This prevents race conditions and ensures efficient resource usage
	queueTypes := []string{
		queue.QUEUE_NOTE_DELETE,
		queue.QUEUE_IMAGE_DELETE,
		queue.QUEUE_NOTE_PROCESS,
		queue.QUEUE_IMAGE_PROCESS,
	}

	for _, queueType := range queueTypes {
		for {
			if !isIntelligenceAvailable() {
				return
			}

			task, err := queue.GetNextTask(queueType, queue.STATUS_QUEUED)
			if err != nil {
				break // No more tasks
			}

			queue.UpdateTaskStatus(task.ID, queue.STATUS_PROCESSING)

			entityID, ok := queue.ParseTaskPayload(task)
			if !ok {
				continue
			}

			var processingErr error
			switch queueType {
			case queue.QUEUE_NOTE_PROCESS:
				processingErr = embedNote(entityID)
			case queue.QUEUE_NOTE_DELETE:
				processingErr = deleteNoteEmbeddings(entityID)
			case queue.QUEUE_IMAGE_PROCESS:
				processingErr = embedImage(entityID)
			case queue.QUEUE_IMAGE_DELETE:
				processingErr = deleteImageEmbeddings(entityID)
			}

			if processingErr != nil {
				slog.Error("Failed to process task", "queueType", queueType, "taskID", task.ID, "entityID", entityID, "error", processingErr)

				err := queue.MarkTaskFailed(task.ID, processingErr.Error())
				if err != nil && errors.Is(err, sql.ErrNoRows) {
					slog.Info("task was deleted during processing, ignoring failure", "taskID", task.ID)
				} else if err != nil {
					slog.Error("Failed to mark task as failed", "taskID", task.ID, "error", err)
				}
			} else {
				slog.Info("processed task", "queueType", queueType, "taskID", task.ID, "entityID", entityID)
				queue.RemoveTask(task.ID)
			}
		}
	}
}

func embedNote(noteIDStr string) error {
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		return fmt.Errorf("invalid note ID: %w", err)
	}

	note, err := notes.GetNoteByID(noteID)
	if err != nil {
		return fmt.Errorf("failed to get note: %w", err)
	}

	if note.IsDeleted || note.IsArchived {
		slog.Info("skipping deleted or archived note", "noteID", noteID)
		return nil
	}

	tags := make([]string, len(note.Tags))
	for i, tag := range note.Tags {
		tags[i] = tag.Name
	}

	return EmbedNote(noteID, note.Title, note.Content, tags, note.UpdatedAt.Format(time.RFC3339))
}

func deleteNoteEmbeddings(noteIDStr string) error {
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		return fmt.Errorf("invalid note ID: %w", err)
	}

	return DeleteNoteEmbeddings(noteID)
}

func embedImage(filename string) error {
	image, err := images.GetImageByFilename(filename)
	if err != nil {
		return fmt.Errorf("failed to get image metadata: %w", err)
	}

	imagesFolder := os.Getenv("IMAGES_FOLDER")
	if imagesFolder == "" {
		imagesFolder = "./images"
	}
	imagePath := fmt.Sprintf("%s/%s", imagesFolder, filename)

	return EmbedImage(
		filename,
		imagePath,
		image.Width,
		image.Height,
		image.AspectRatio,
		image.FileSize,
		image.Format,
	)
}

func deleteImageEmbeddings(filename string) error {
	return DeleteImageEmbeddings(filename)
}
