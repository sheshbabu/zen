package queue

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"time"
	"zen/commons/sqlite"
)

const (
	QUEUE_NOTE_PROCESS = "note_process"
	QUEUE_NOTE_DELETE  = "note_delete"

	QUEUE_IMAGE_PROCESS = "image_process"
	QUEUE_IMAGE_DELETE  = "image_delete"

	STATUS_QUEUED     = "queued"
	STATUS_PROCESSING = "processing"
	STATUS_FAILED     = "failed"
)

type Task struct {
	ID           int        `json:"id"`
	QueueName    string     `json:"queue_name"`
	Payload      string     `json:"payload"`
	Status       string     `json:"status"`
	RetryCount   int        `json:"retry_count"`
	MaxRetries   int        `json:"max_retries"`
	ErrorMessage *string    `json:"error_message"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	ProcessedAt  *time.Time `json:"processed_at"`
}

type QueueStats struct {
	QueueName  string `json:"queue_name"`
	Pending    int    `json:"pending"`
	Processing int    `json:"processing"`
	Failed     int    `json:"failed"`
	Total      int    `json:"total"`
}

func AddTask(queueName, payload string) (int, error) {
	query := `
		INSERT INTO queue (queue_name, payload, status)
		VALUES (?, ?, ?)
	`

	result, err := sqlite.DB.Exec(query, queueName, payload, STATUS_QUEUED)
	if err != nil {
		err = fmt.Errorf("error adding task into queue: %w", err)
		slog.Error(err.Error())
		return 0, err
	}

	taskID, err := result.LastInsertId()
	if err != nil {
		err = fmt.Errorf("error getting task ID: %w", err)
		slog.Error(err.Error())
		return 0, err
	}

	return int(taskID), nil
}

func UpdateTaskStatus(taskID int, status string) error {
	query := `
		UPDATE queue
		SET status = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err := sqlite.DB.Exec(query, status, taskID)
	if err != nil {
		err = fmt.Errorf("error updating task status in queue: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func MarkTaskFailed(taskID int, errorMessage string) error {
	// First get current retry count
	var retryCount, maxRetries int
	query := `SELECT retry_count, max_retries FROM queue WHERE id = ?`
	err := sqlite.DB.QueryRow(query, taskID).Scan(&retryCount, &maxRetries)
	if err != nil {
		err = fmt.Errorf("error getting task retry info: %w", err)
		slog.Error(err.Error())
		return err
	}

	retryCount++
	status := STATUS_FAILED

	// If we haven't exceeded max retries, set back to queued for retry
	// max_retries=3 means: 1 initial attempt + 3 retry attempts = 4 total attempts
	if retryCount < maxRetries {
		status = STATUS_QUEUED
		slog.Info("task will be retried", "taskID", taskID, "retryCount", retryCount, "maxRetries", maxRetries, "attemptsRemaining", maxRetries-retryCount)
	} else {
		slog.Error("task exceeded max retries, marking as failed", "taskID", taskID, "retryCount", retryCount, "maxRetries", maxRetries, "totalAttempts", retryCount+1)
	}

	updateQuery := `
		UPDATE queue
		SET status = ?, retry_count = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err = sqlite.DB.Exec(updateQuery, status, retryCount, errorMessage, taskID)
	if err != nil {
		err = fmt.Errorf("error marking task as failed: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func RemoveTask(taskID int) error {
	query := `
		DELETE FROM queue
		WHERE id = ?
	`

	_, err := sqlite.DB.Exec(query, taskID)
	if err != nil {
		err = fmt.Errorf("error deleting task in queue: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func RemoveAllTasksForEntity(entityType, entityID string) error {
	query := `
		DELETE FROM queue
		WHERE json_extract(payload, '$.entity_type') = ?
		AND json_extract(payload, '$.entity_id') = ?
	`

	_, err := sqlite.DB.Exec(query, entityType, entityID)
	if err != nil {
		err = fmt.Errorf("error deleting all tasks for entity in queue: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func GetNextTask(queueName, status string) (*Task, error) {
	var task Task

	query := `
		SELECT
			id,
			queue_name,
			payload,
			status,
			retry_count,
			max_retries,
			error_message,
			created_at,
			updated_at,
			processed_at
		FROM queue
		WHERE queue_name = ? AND status = ?
		ORDER BY created_at ASC
		LIMIT 1
	`

	row := sqlite.DB.QueryRow(query, queueName, status)
	err := row.Scan(&task.ID, &task.QueueName, &task.Payload, &task.Status,
		&task.RetryCount, &task.MaxRetries, &task.ErrorMessage,
		&task.CreatedAt, &task.UpdatedAt, &task.ProcessedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	if err != nil {
		err = fmt.Errorf("error retrieving task in queue: %w", err)
		slog.Error(err.Error())
		return nil, err
	}

	return &task, nil
}

func GetFailedTasks(limit int) ([]Task, error) {
	var tasks []Task

	query := `
		SELECT
			id,
			queue_name,
			payload,
			status,
			retry_count,
			max_retries,
			error_message,
			created_at,
			updated_at,
			processed_at
		FROM queue
		WHERE status = ?
		ORDER BY updated_at DESC
		LIMIT ?
	`

	rows, err := sqlite.DB.Query(query, STATUS_FAILED, limit)
	if err != nil {
		err = fmt.Errorf("error retrieving failed tasks: %w", err)
		slog.Error(err.Error())
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var task Task
		err := rows.Scan(&task.ID, &task.QueueName, &task.Payload, &task.Status,
			&task.RetryCount, &task.MaxRetries, &task.ErrorMessage,
			&task.CreatedAt, &task.UpdatedAt, &task.ProcessedAt)
		if err != nil {
			err = fmt.Errorf("error scanning failed task: %w", err)
			slog.Error(err.Error())
			return nil, err
		}
		tasks = append(tasks, task)
	}

	if err = rows.Err(); err != nil {
		err = fmt.Errorf("error iterating failed tasks: %w", err)
		slog.Error(err.Error())
		return nil, err
	}

	return tasks, nil
}

func RetryFailedTask(taskID int) error {
	query := `
		UPDATE queue
		SET status = ?, retry_count = 0, error_message = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND status = ?
	`

	result, err := sqlite.DB.Exec(query, STATUS_QUEUED, taskID, STATUS_FAILED)
	if err != nil {
		return fmt.Errorf("error retrying failed task: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking retry result: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("task %d not found or not in failed state", taskID)
	}

	slog.Info("task manually retried", "taskID", taskID)
	return nil
}

func GetQueueStats(queueName string) (*QueueStats, error) {
	stats := &QueueStats{QueueName: queueName}

	query := `
		SELECT status, COUNT(*) as count
		FROM queue
		WHERE queue_name = ?
		GROUP BY status
	`

	rows, err := sqlite.DB.Query(query, queueName)
	if err != nil {
		return nil, fmt.Errorf("error getting queue stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, fmt.Errorf("error scanning queue stats: %w", err)
		}

		switch status {
		case STATUS_QUEUED:
			stats.Pending = count
		case STATUS_PROCESSING:
			stats.Processing = count
		case STATUS_FAILED:
			stats.Failed = count
		}
	}

	stats.Total = stats.Pending + stats.Processing + stats.Failed
	return stats, nil
}

func GetAllQueueStats() ([]QueueStats, error) {
	var allStats []QueueStats

	queueNames := []string{
		QUEUE_NOTE_PROCESS,
		QUEUE_NOTE_DELETE,
		QUEUE_IMAGE_PROCESS,
		QUEUE_IMAGE_DELETE,
	}

	for _, queueName := range queueNames {
		stats, err := GetQueueStats(queueName)
		if err != nil {
			return nil, err
		}
		allStats = append(allStats, *stats)
	}

	return allStats, nil
}

func Clear() error {
	query := `DELETE FROM queue`

	_, err := sqlite.DB.Exec(query)
	if err != nil {
		err = fmt.Errorf("error clearing queue: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}
