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
			t.tag_id,
			t.name,
			COUNT(nt.note_id) AS note_count
		FROM
			tags t
		LEFT JOIN
			note_tags nt ON t.tag_id = nt.tag_id
		GROUP BY
			t.tag_id, t.name
		ORDER BY
			note_count DESC
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
		var count int
		err = rows.Scan(&tag.TagID, &tag.Name, &count)
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
		-- Boosting rows starting with the search term
		ORDER BY 
			CASE
				WHEN name LIKE ? || '%' THEN 1
				ELSE 2
			END
	`

	rows, err := sqlite.DB.Query(query, term, term)
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
			t.name,
			COUNT(nt.note_id) AS note_count
		FROM
			tags t
		LEFT JOIN
			note_tags nt ON t.tag_id = nt.tag_id
		JOIN
			focus_mode_tags f ON t.tag_id = f.tag_id
		WHERE
			f.focus_mode_id = ?
		GROUP BY
			t.tag_id, t.name
		ORDER BY
			t.tag_id ASC
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
		var count int
		err = rows.Scan(&tag.TagID, &tag.Name, &count)
		if err != nil {
			err = fmt.Errorf("error scanning tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func UpdateTag(tag Tag) error {
	query := `
		UPDATE
			tags
		SET
			name = ?
		WHERE
			tag_id = ?
	`

	_, err := sqlite.DB.Exec(query, tag.Name, tag.TagID)
	if err != nil {
		err = fmt.Errorf("error updating tag: %w", err)
		slog.Error(err.Error())
		return err
	}
	return nil
}

func DeleteTag(tagID int) error {
	query := `
		DELETE FROM
			note_tags
		WHERE
			tag_id = ?;

		DELETE FROM
			tags
		WHERE
			tag_id = ?;
	`

	_, err := sqlite.DB.Exec(query, tagID, tagID)
	if err != nil {
		err = fmt.Errorf("error deleting tag: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}
