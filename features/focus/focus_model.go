package focus

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"time"
	"zen/commons/sqlite"
	"zen/features/tags"
)

var defaultFocusMode = FocusMode{
	FocusModeID: 0,
	Name:        "Everything",
	Tags:        nil,
	LastUsedAt:  time.Now(),
}

func GetAllFocusModes() ([]FocusMode, error) {
	var focusModes []FocusMode

	focusModes = append(focusModes, defaultFocusMode)

	query := `
		SELECT
			fm.focus_mode_id,
			fm.name,
            COALESCE(
                JSON_GROUP_ARRAY(JSON_OBJECT(
					'tagId', t.tag_id,
					'name', t.name
				)), '[]'
            ) as tags_json,
			fm.last_used_at
		FROM
			focus_modes fm
			LEFT JOIN focus_mode_tags fmt ON fm.focus_mode_id = fmt.focus_mode_id
			LEFT JOIN tags t ON fmt.tag_id = t.tag_id
		GROUP BY
            fm.focus_mode_id, fm.name, fm.last_used_at
		ORDER BY
			fm.last_used_at DESC
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
		var tagsJSON string
		err = rows.Scan(&focusMode.FocusModeID, &focusMode.Name, &tagsJSON, &focusMode.LastUsedAt)
		if err != nil {
			err = fmt.Errorf("error scanning focus mode: %w", err)
			slog.Error(err.Error())
			return focusModes, err
		}
		err = json.Unmarshal([]byte(tagsJSON), &focusMode.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for focus mode %d: %w", focusMode.FocusModeID, err)
			slog.Error(err.Error())
			focusMode.Tags = []tags.Tag{}
		}
		focusModes = append(focusModes, focusMode)
	}

	return focusModes, nil
}

func GetFocusModeByID(focusModeID int) (FocusMode, error) {
	var focusMode FocusMode
	var tagsJSON string

	query := `
		SELECT
			fm.focus_mode_id,
			fm.name,
            COALESCE(
                JSON_GROUP_ARRAY(JSON_OBJECT(
					'tagId', t.tag_id,
					'name', t.name
				)), '[]'
            ) as tags_json,
			fm.last_used_at
		FROM
			focus_modes fm
			LEFT JOIN focus_mode_tags fmt ON fm.focus_mode_id = fmt.focus_mode_id
			LEFT JOIN tags t ON fmt.tag_id = t.tag_id
		WHERE
			fm.focus_mode_id = ?
		GROUP BY
            fm.focus_mode_id, fm.name, fm.last_used_at
		ORDER BY
			fm.last_used_at DESC
	`

	err := sqlite.DB.QueryRow(query, focusModeID).Scan(&focusMode.FocusModeID, &focusMode.Name, &tagsJSON, &focusMode.LastUsedAt)
	if err != nil {
		err = fmt.Errorf("error retrieving focus mode: %w", err)
		slog.Error(err.Error())
		return focusMode, err
	}

	err = json.Unmarshal([]byte(tagsJSON), &focusMode.Tags)
	if err != nil {
		err = fmt.Errorf("error unmarshaling tags for focus mode %d: %w", focusMode.FocusModeID, err)
		slog.Error(err.Error())
		focusMode.Tags = []tags.Tag{}
	}

	return focusMode, nil
}

func UpdateFocusMode(focusMode *FocusMode) error {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	defer tx.Rollback()

	query := `
		UPDATE
			focus_modes
		SET
			name = ?,
			last_used_at = CURRENT_TIMESTAMP
		WHERE
			focus_mode_id = ?
	`

	_, err = tx.Exec(query, focusMode.Name, focusMode.FocusModeID)
	if err != nil {
		err = fmt.Errorf("error updating focus mode: %w", err)
		slog.Error(err.Error())
		return err
	}

	query = `
		DELETE FROM
			focus_mode_tags
		WHERE
			focus_mode_id = ?
	`

	_, err = tx.Exec(query, focusMode.FocusModeID)
	if err != nil {
		err = fmt.Errorf("error deleting old tags for focus mode: %w", err)
		slog.Error(err.Error())
		return err
	}

	for _, tag := range focusMode.Tags {
		query = `
			INSERT INTO
				focus_mode_tags (focus_mode_id, tag_id)
			VALUES
				(?, ?)
		`

		_, err = tx.Exec(query, focusMode.FocusModeID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error associating tag with focus mode: %w", err)
			slog.Error(err.Error())
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		err = fmt.Errorf("error committing transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func CreateFocusMode(focusMode *FocusMode) error {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	defer tx.Rollback()

	query := `
		INSERT INTO
			focus_modes (name, last_used_at)
		VALUES
			(?, CURRENT_TIMESTAMP)
		RETURNING
			focus_mode_id
	`

	row := tx.QueryRow(query, focusMode.Name)
	err = row.Scan(&focusMode.FocusModeID)
	if err != nil {
		err = fmt.Errorf("error creating focus mode: %w", err)
		slog.Error(err.Error())
		return err
	}

	for _, tag := range focusMode.Tags {
		query = `
			INSERT INTO
				focus_mode_tags (focus_mode_id, tag_id)
			VALUES
				(?, ?)
		`

		_, err = tx.Exec(query, focusMode.FocusModeID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error associating tag with focus mode: %w", err)
			slog.Error(err.Error())
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		err = fmt.Errorf("error committing transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func DeleteFocusMode(focusID int) error {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	defer tx.Rollback()

	query := `
		DELETE FROM
			focus_mode_tags
		WHERE
			focus_mode_id = ?
	`

	_, err = tx.Exec(query, focusID)
	if err != nil {
		err = fmt.Errorf("error deleting focus mode tags: %w", err)
		slog.Error(err.Error())
		return err
	}

	query = `
		DELETE FROM
			focus_modes
		WHERE
			focus_mode_id = ?
	`

	_, err = tx.Exec(query, focusID)
	if err != nil {
		err = fmt.Errorf("error deleting focus mode: %w", err)
		slog.Error(err.Error())
		return err
	}

	err = tx.Commit()
	if err != nil {
		err = fmt.Errorf("error committing transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}
