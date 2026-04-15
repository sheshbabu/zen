package canvas

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
)

func GetAllCanvases() ([]Canvas, error) {
	canvases := []Canvas{}

	query := `
		SELECT
			canvas_id,
			title,
			preview,
			created_at,
			updated_at
		FROM
			canvases
		ORDER BY
			updated_at DESC
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving canvases: %w", err)
		slog.Error(err.Error())
		return canvases, err
	}
	defer rows.Close()

	for rows.Next() {
		var canvas Canvas
		err = rows.Scan(&canvas.CanvasID, &canvas.Title, &canvas.Preview, &canvas.CreatedAt, &canvas.UpdatedAt)
		if err != nil {
			err = fmt.Errorf("error scanning canvas: %w", err)
			slog.Error(err.Error())
			return canvases, err
		}
		canvases = append(canvases, canvas)
	}

	return canvases, nil
}

func GetCanvasByID(canvasID int) (Canvas, error) {
	var canvas Canvas

	query := `
		SELECT
			canvas_id,
			title,
			data,
			preview,
			created_at,
			updated_at
		FROM
			canvases
		WHERE
			canvas_id = ?
	`

	err := sqlite.DB.QueryRow(query, canvasID).Scan(&canvas.CanvasID, &canvas.Title, &canvas.Data, &canvas.Preview, &canvas.CreatedAt, &canvas.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = fmt.Errorf("canvas not found: %w", err)
		} else {
			err = fmt.Errorf("error retrieving canvas: %w", err)
		}
		slog.Error(err.Error())
		return canvas, err
	}

	return canvas, nil
}

func CreateCanvas(canvas *Canvas) error {
	query := `
		INSERT INTO
			canvases (title, data, preview, created_at, updated_at)
		VALUES
			(?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING
			canvas_id, created_at, updated_at
	`

	if canvas.Title == "" {
		canvas.Title = "Untitled Canvas"
	}
	if canvas.Data == "" {
		canvas.Data = `{"nodes":[],"edges":[]}`
	}
	if canvas.Preview == "" {
		canvas.Preview = `{"nodes":[],"width":200,"height":150,"nodeCount":0}`
	}

	row := sqlite.DB.QueryRow(query, canvas.Title, canvas.Data, canvas.Preview)
	err := row.Scan(&canvas.CanvasID, &canvas.CreatedAt, &canvas.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error creating canvas: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func UpdateCanvas(canvas *Canvas) error {
	existing, err := GetCanvasByID(canvas.CanvasID)
	if err != nil {
		return err
	}

	if canvas.Title == "" {
		canvas.Title = existing.Title
	}
	if canvas.Data == "" {
		canvas.Data = existing.Data
	}
	if canvas.Preview == "" {
		canvas.Preview = existing.Preview
	}

	query := `
		UPDATE
			canvases
		SET
			title = ?,
			data = ?,
			preview = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE
			canvas_id = ?
		RETURNING
			updated_at
	`

	err = sqlite.DB.QueryRow(query, canvas.Title, canvas.Data, canvas.Preview, canvas.CanvasID).Scan(&canvas.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error updating canvas: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func DeleteCanvas(canvasID int) error {
	query := `
		DELETE FROM
			canvases
		WHERE
			canvas_id = ?
	`

	result, err := sqlite.DB.Exec(query, canvasID)
	if err != nil {
		err = fmt.Errorf("error deleting canvas: %w", err)
		slog.Error(err.Error())
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		err = fmt.Errorf("error getting rows affected: %w", err)
		slog.Error(err.Error())
		return err
	}

	if rowsAffected == 0 {
		err = fmt.Errorf("canvas not found")
		return err
	}

	return nil
}
