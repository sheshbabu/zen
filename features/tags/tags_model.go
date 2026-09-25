package tags

import (
	"fmt"
	"log/slog"
	"strings"
	"zen/commons/auth"
	"zen/commons/sqlite"
)

func GetAllTags(access auth.Access) ([]Tag, error) {
	tags := []Tag{}
	scopePredicate, scopeArgs := BuildReadableTagsPredicate(access, "t.tag_id")
	query := `
		SELECT
			t.tag_id,
			t.name,
			t.color,
			COUNT(nt.note_id) AS note_count
		FROM
			tags t
		LEFT JOIN
			note_tags nt ON t.tag_id = nt.tag_id
		WHERE
			1 ` + scopePredicate + `
		GROUP BY
			t.tag_id, t.name, t.color
		ORDER BY
			note_count DESC
	`

	rows, err := sqlite.DB.Query(query, scopeArgs...)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name, &tag.Color, &tag.NoteCount)
		if err != nil {
			err = fmt.Errorf("error scanning tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func SearchTags(access auth.Access, term string) ([]Tag, error) {
	tags := []Tag{}
	scopePredicate, scopeArgs := BuildReadableTagsPredicate(access, "t.tag_id")
	query := `
		SELECT
			t.tag_id,
			t.name,
			t.color,
			COUNT(nt.note_id) AS note_count
		FROM
			tags t
		LEFT JOIN
			note_tags nt ON t.tag_id = nt.tag_id
		WHERE
			t.name LIKE '%' || ? || '%'
			` + scopePredicate + `
		GROUP BY
			t.tag_id, t.name, t.color
		ORDER BY
			-- Boosting rows starting with the search term
			CASE
				WHEN t.name LIKE ? || '%' THEN 1
				ELSE 2
			END,
			-- Boosting rows with more notes
			note_count DESC
	`

	queryArgs := []interface{}{term}
	queryArgs = append(queryArgs, scopeArgs...)
	queryArgs = append(queryArgs, term)

	rows, err := sqlite.DB.Query(query, queryArgs...)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name, &tag.Color, &tag.NoteCount)
		if err != nil {
			err = fmt.Errorf("error scanning tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func GetTagsByFocusModeID(access auth.Access, focusModeID int) ([]Tag, error) {
	tags := []Tag{}
	scopePredicate, scopeArgs := BuildReadableTagsPredicate(access, "t.tag_id")
	query := `
		SELECT
			t.tag_id,
			t.name,
			t.color,
			COUNT(nt.note_id) AS note_count
		FROM
			tags t
		LEFT JOIN
			note_tags nt ON t.tag_id = nt.tag_id
		JOIN
			focus_mode_tags f ON t.tag_id = f.tag_id
		WHERE
			f.focus_mode_id = ?
			` + scopePredicate + `
		GROUP BY
			t.tag_id, t.name, t.color
		ORDER BY
			t.tag_id ASC
	`

	queryArgs := []interface{}{focusModeID}
	queryArgs = append(queryArgs, scopeArgs...)

	rows, err := sqlite.DB.Query(query, queryArgs...)
	if err != nil {
		err = fmt.Errorf("error retrieving tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name, &tag.Color, &tag.NoteCount)
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
			name = ?,
			color = ?
		WHERE
			tag_id = ?
	`

	_, err := sqlite.DB.Exec(query, tag.Name, tag.Color, tag.TagID)
	if err != nil {
		err = fmt.Errorf("error updating tag: %w", err)
		slog.Error(err.Error())
		return err
	}
	return nil
}

func DeleteTag(tagID int) error {
	tx, err := sqlite.DB.Begin()
	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM note_tags WHERE tag_id = ?", tagID)
	if err != nil {
		err = fmt.Errorf("error deleting from note_tags: %w", err)
		slog.Error(err.Error())
		return err
	}

	_, err = tx.Exec("DELETE FROM api_token_scopes WHERE tag_id = ?", tagID)
	if err != nil {
		err = fmt.Errorf("error deleting from api_token_scopes: %w", err)
		slog.Error(err.Error())
		return err
	}

	_, err = tx.Exec("DELETE FROM tags WHERE tag_id = ?", tagID)
	if err != nil {
		err = fmt.Errorf("error deleting from tags: %w", err)
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

func BuildReadableTagsPredicate(access auth.Access, tagIDColumn string) (string, []interface{}) {
	if auth.CanReadAllTags(access) {
		return "", nil
	}

	if len(access.ReadTagIDs) == 0 {
		return "AND 0", nil
	}

	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(access.ReadTagIDs)), ",")
	args := []interface{}{}
	for _, tagID := range access.ReadTagIDs {
		args = append(args, tagID)
	}

	return fmt.Sprintf("AND %s IN (%s)", tagIDColumn, placeholders), args
}
