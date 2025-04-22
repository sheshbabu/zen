package tags

import (
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
)

func GetAllTags() ([]Tag, error) {
	var tags []Tag
	query := `
		SELECT
			tag_id,
			name
		FROM
			tags
		ORDER BY
			tag_id DESC
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name)
		if err != nil {
			err = fmt.Errorf("error scanning tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func SearchTags(term string) ([]Tag, error) {
	tags := []Tag{}
	query := `
		SELECT
			tag_id,
			name
		FROM
			tags
		WHERE
			name LIKE '%' || ? || '%'
	`

	rows, err := sqlite.DB.Query(query, term)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name)
		if err != nil {
			err = fmt.Errorf("error scanning tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func GetTagsByFocusModeID(focusModeID int) ([]Tag, error) {
	tags := []Tag{}
	query := `
		SELECT
			t.tag_id,
			t.name
		FROM
			tags t
		JOIN
			focus_mode_tags f ON t.tag_id = f.tag_id
		WHERE
			f.focus_mode_id = ?
	`

	rows, err := sqlite.DB.Query(query, focusModeID)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name)
		if err != nil {
			err = fmt.Errorf("error scanning tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func UpdateTag(tag Tag) (Tag, error) {
	query := `
		UPDATE
			tags
		SET
			name = ?
		WHERE
			tag_id = ?
		RETURNING
			tag_id,
			name
	`

	row := sqlite.DB.QueryRow(query, tag.Name, tag.TagID)
	err := row.Scan(&tag.TagID, &tag.Name)
	if err != nil {
		err = fmt.Errorf("error updating tag: %w", err)
		slog.Error(err.Error())
		return tag, err
	}

	return tag, nil
}

func DeleteTag(tagID int) error {
	query := `
		DELETE FROM
			tags
		WHERE
			tag_id = ?
	`

	_, err := sqlite.DB.Exec(query, tagID)
	if err != nil {
		err = fmt.Errorf("error deleting tag: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}
