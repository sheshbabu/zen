package intelligence

import (
	"database/sql"
	"errors"
	"log/slog"
	"sync"
	"zen/commons/queue"
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

	for {
		hasWork := false

		for _, queueType := range queueTypes {
			if !isIntelligenceAvailable() {
				return
			}

			task, err := queue.GetNextTask(queueType, queue.STATUS_QUEUED)
			if err != nil {
				continue // No tasks
			}

			hasWork = true
			queue.UpdateTaskStatus(task.ID, queue.STATUS_PROCESSING)

			entityID, ok := queue.ParseTaskPayload(task)
			if !ok {
				continue
			}

			var processingErr error
			switch queueType {
			case queue.QUEUE_NOTE_PROCESS:
				processingErr = ProcessNoteForEmbedding(entityID)
			case queue.QUEUE_NOTE_DELETE:
				processingErr = DeleteNoteEmbeddings(entityID)
			case queue.QUEUE_IMAGE_PROCESS:
				processingErr = ProcessImageForEmbedding(entityID)
			case queue.QUEUE_IMAGE_DELETE:
				processingErr = DeleteImageEmbeddings(entityID)
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

		if !hasWork {
			break
		}
	}
}
