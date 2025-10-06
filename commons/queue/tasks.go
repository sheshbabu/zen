package queue

import (
	"encoding/json"
	"fmt"
	"log/slog"
)

func AddNoteTask(noteID int, queueName, action string) (int, error) {
	payload := map[string]interface{}{
		"entity_type": "note",
		"entity_id":   fmt.Sprintf("%d", noteID),
		"action":      action,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal note task payload: %w", err)
	}

	return AddTask(queueName, string(payloadBytes))
}

func AddImageTask(filename, queueName, action string) (int, error) {
	payload := map[string]interface{}{
		"entity_type": "image",
		"entity_id":   filename,
		"action":      action,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal image task payload: %w", err)
	}

	return AddTask(queueName, string(payloadBytes))
}

func RemoveAllNoteTasks(noteID int) error {
	return RemoveAllTasksForEntity("note", fmt.Sprintf("%d", noteID))
}

func RemoveAllImageTasks(filename string) error {
	return RemoveAllTasksForEntity("image", filename)
}

func ParseTaskPayload(task *Task) (entityID string, ok bool) {
	var payload map[string]string
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		slog.Error("Failed to parse task payload", "taskID", task.ID, "error", err)
		MarkTaskFailed(task.ID, fmt.Sprintf("Invalid JSON payload: %v", err))
		return "", false
	}

	entityID, exists := payload["entity_id"]
	if !exists {
		slog.Error("Missing entity_id in task payload", "taskID", task.ID)
		MarkTaskFailed(task.ID, "Missing entity_id in payload")
		return "", false
	}

	return entityID, true
}
