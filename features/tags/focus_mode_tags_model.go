package tags

import (
	"fmt"
	"log/slog"
	"strconv"
	"zen/commons/sqlite"
)

func GetFocusModeTags(focusModeID int) ([]Tag, error) {
	var tags []Tag
	query := `
		SELECT
			t.tag_id,
			t.name
		FROM
			focus_mode_tags f
		JOIN
			tags t ON f.tag_id = t.tag_id
		WHERE
			f.focus_mode_id = ?
	`

	rows, err := sqlite.DB.Query(query, focusModeID)
	if err != nil {
		err = fmt.Errorf("error retrieving focus mode tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name)
		if err != nil {
			err = fmt.Errorf("error scanning focus mode tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func UpdateFocusModeTags(focusModeID int, tagIDs []string) ([]Tag, error) {
	var tags []Tag
	query := `
		DELETE FROM
			focus_mode_tags
		WHERE
			focus_mode_id = ?
	`

	_, err := sqlite.DB.Exec(query, focusModeID)
	if err != nil {
		err = fmt.Errorf("error updating focus mode tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	query = `
		INSERT INTO
			focus_mode_tags (focus_mode_id, tag_id)
		VALUES
			(?, ?)
	`

	for _, tagIDStr := range tagIDs {
		tagID, err := strconv.Atoi(tagIDStr)
		if err != nil {
			err = fmt.Errorf("error parsing tag ID: %w", err)
			slog.Error(err.Error())
			return tags, err
		}

		_, err = sqlite.DB.Exec(query, focusModeID, tagID)
		if err != nil {
			err = fmt.Errorf("error updating focus mode tags: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
	}

	tags, err = GetFocusModeTags(focusModeID)
	if err != nil {
		err = fmt.Errorf("error updating focus mode tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	return tags, nil
}

func AddFocusModeTag(focusModeID, tagID int) ([]Tag, error) {
	var tags []Tag

	query := `
		INSERT INTO
			focus_mode_tags (focus_mode_id, tag_id)
		VALUES
			(?, ?)
	`

	_, err := sqlite.DB.Exec(query, focusModeID, tagID)
	if err != nil {
		err = fmt.Errorf("error adding focus mode tag: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	tags, err = GetFocusModeTags(focusModeID)
	if err != nil {
		err = fmt.Errorf("error updating focus mode tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	return tags, nil
}
