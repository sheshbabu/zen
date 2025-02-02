package focus

import (
	"fmt"
	"log/slog"
	"time"
	"zen/commons/sqlite"
)

var defaultFocusMode = FocusMode{
	FocusModeID: 0,
	Name:        "All Notes",
	LastUsedAt:  time.Now(),
}

func GetAllFocusModes() ([]FocusMode, error) {
	var focusModes []FocusMode

	focusModes = append(focusModes, defaultFocusMode)

	query := `
		SELECT
			focus_mode_id,
			name,
			last_used_at
		FROM
			focus_modes
		ORDER BY
			last_used_at DESC
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving focus modes: %w", err)
		slog.Error(err.Error())
		return focusModes, err
	}
	defer rows.Close()

	for rows.Next() {
		var focusMode FocusMode
		err = rows.Scan(&focusMode.FocusModeID, &focusMode.Name, &focusMode.LastUsedAt)
		if err != nil {
			err = fmt.Errorf("error scanning focus mode: %w", err)
			slog.Error(err.Error())
			return focusModes, err
		}
		focusModes = append(focusModes, focusMode)
	}

	return focusModes, nil
}

func UpdateFocusMode(focusModeID int) error {
	query := `
		UPDATE
			focus_modes
		SET
			last_used_at = CURRENT_TIMESTAMP
		WHERE
			focus_mode_id = ?
	`

	_, err := sqlite.DB.Exec(query, focusModeID)
	if err != nil {
		err = fmt.Errorf("error updating focus mode: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func CreateFocusMode(name string) error {
	query := `
		INSERT INTO
			focus_modes (name, last_used_at)
		VALUES
			(?, CURRENT_TIMESTAMP)
	`

	_, err := sqlite.DB.Exec(query, name)
	if err != nil {
		err = fmt.Errorf("error creating focus mode: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func GetFocusModeByID(focusModeID int) (FocusMode, error) {
	var focusMode FocusMode

	query := `
		SELECT
			focus_mode_id,
			name,
			last_used_at
		FROM
			focus_modes
		WHERE
			focus_mode_id = ?
	`

	err := sqlite.DB.QueryRow(query, focusModeID).Scan(&focusMode.FocusModeID, &focusMode.Name, &focusMode.LastUsedAt)
	if err != nil {
		err = fmt.Errorf("error retrieving focus mode: %w", err)
		slog.Error(err.Error())
		return focusMode, err
	}

	return focusMode, nil
}
