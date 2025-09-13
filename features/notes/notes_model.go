package notes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
	"zen/features/tags"
)

const NOTES_LIMIT = 100

func GetAllNotes(filter NotesFilter) ([]Note, int, error) {
	notes := []Note{}
	total := 0
	offset := (filter.page - 1) * NOTES_LIMIT

	var query string
	var queryArgs []interface{}

	if filter.tagID != 0 {
		query = `
			SELECT
				n.note_id,
				n.title,
				n.content,
				SUBSTR(n.content, 0, 500) AS snippet,
				n.updated_at,
				COALESCE(
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t2.tag_id,
						'name', t2.name
					)), '[]'
				) as tags_json,
				n.archived_at,
				n.deleted_at,
				n.pinned_at,
				COUNT(*) OVER() as total_count
			FROM
				notes n
			INNER JOIN
				note_tags nt ON n.note_id = nt.note_id
			INNER JOIN
				tags t ON nt.tag_id = t.tag_id
			LEFT JOIN
				note_tags nt2 ON n.note_id = nt2.note_id
			LEFT JOIN
				tags t2 ON nt2.tag_id = t2.tag_id
			WHERE
				t.tag_id = ? AND n.deleted_at IS NULL AND n.archived_at IS NULL
			GROUP BY
				n.note_id
			ORDER BY
				CASE 
					WHEN n.pinned_at IS NOT NULL THEN 1 
					ELSE 2 
				END,
				COALESCE(n.pinned_at, n.updated_at) DESC
			LIMIT
				?
			OFFSET
				?
		`
		queryArgs = []interface{}{filter.tagID, NOTES_LIMIT, offset}
	} else if filter.focusModeID != 0 {
		query = `
			SELECT
				n.note_id,
				n.title,
				n.content,
				SUBSTR(n.content, 0, 500) AS snippet,
				n.updated_at,
				COALESCE(
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t.tag_id,
						'name', t.name
					)), '[]'
				) as tags_json,
				n.archived_at,
				n.deleted_at,
				n.pinned_at,
				COUNT(*) OVER() as total_count
			FROM
				focus_mode_tags fmt
			JOIN
				note_tags nt ON fmt.tag_id = nt.tag_id
			JOIN
				notes n ON nt.note_id = n.note_id
			JOIN
				tags t ON nt.tag_id = t.tag_id
			WHERE
				fmt.focus_mode_id = ? AND n.deleted_at IS NULL AND n.archived_at IS NULL
			GROUP BY
				n.note_id
			ORDER BY
				CASE 
					WHEN n.pinned_at IS NOT NULL THEN 1 
					ELSE 2 
				END,
				COALESCE(n.pinned_at, n.updated_at) DESC
			LIMIT
				?
			OFFSET
				?
		`
		queryArgs = []interface{}{filter.focusModeID, NOTES_LIMIT, offset}
	} else {
		whereCondition := ""
		if filter.isDeleted {
			whereCondition = "WHERE n.deleted_at IS NOT NULL"
		} else if filter.isArchived {
			whereCondition = "WHERE n.archived_at IS NOT NULL"
		} else {
			whereCondition = "WHERE n.deleted_at IS NULL AND n.archived_at IS NULL"
		}

		query = fmt.Sprintf(`
			SELECT
				n.note_id,
				n.title,
				n.content,
				SUBSTR(n.content, 0, 500) AS snippet,
				n.updated_at,
				CASE
					WHEN COUNT(t.tag_id) > 0 THEN
						JSON_GROUP_ARRAY(JSON_OBJECT(
							'tagId', t.tag_id,
							'name', t.name
						))
					ELSE '[]'
				END AS tags_json,
				n.archived_at,
				n.deleted_at,
				n.pinned_at,
				COUNT(*) OVER() as total_count
			FROM
				notes n
			LEFT JOIN
				note_tags nt ON n.note_id = nt.note_id
			LEFT JOIN
				tags t ON nt.tag_id = t.tag_id
			%s
			GROUP BY
				n.note_id
			ORDER BY
				CASE 
					WHEN n.pinned_at IS NOT NULL THEN 1 
					ELSE 2 
				END,
				COALESCE(n.pinned_at, n.updated_at) DESC
			LIMIT
				?
			OFFSET
				?
		`, whereCondition)
		queryArgs = []interface{}{NOTES_LIMIT, offset}
	}

	rows, err := sqlite.DB.Query(query, queryArgs...)
	if err != nil {
		err = fmt.Errorf("error retrieving notes: %w", err)
		slog.Error(err.Error())
		return notes, total, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var tagsJSON string
		var archivedAt sql.NullTime
		var deletedAt sql.NullTime
		var pinnedAt sql.NullTime
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &tagsJSON, &archivedAt, &deletedAt, &pinnedAt, &total)
		if err != nil {
			err = fmt.Errorf("error scanning note: %w", err)
			slog.Error(err.Error())
			return notes, total, err
		}
		err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
			slog.Error(err.Error())
			note.Tags = []tags.Tag{}
		}
		note.IsArchived = archivedAt.Valid
		note.IsDeleted = deletedAt.Valid
		note.IsPinned = pinnedAt.Valid
		notes = append(notes, note)
	}

	return notes, total, nil
}

func GetNoteByID(noteID int) (Note, error) {
	var note Note
	var tagsJSON string
	var archivedAt sql.NullTime
	var deletedAt sql.NullTime

	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(content, 0, 500) AS snippet,
			n.updated_at,
			CASE
				WHEN COUNT(t.tag_id) > 0 THEN
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t.tag_id,
						'name', t.name
					))
				ELSE '[]'
			END AS tags_json,
			n.archived_at,
			n.deleted_at,
			n.pinned_at
		FROM
			notes n
		LEFT JOIN
			note_tags nt ON n.note_id = nt.note_id
		LEFT JOIN
			tags t ON nt.tag_id = t.tag_id
		WHERE
			n.note_id = ?
		GROUP BY
			n.note_id
	`

	row := sqlite.DB.QueryRow(query, noteID)
	var pinnedAt sql.NullTime
	err := row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &tagsJSON, &archivedAt, &deletedAt, &pinnedAt)
	if err != nil {
		err = fmt.Errorf("error retrieving note: %w", err)
		slog.Error(err.Error())
		return note, err
	}
	err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
	if err != nil {
		err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
		slog.Error(err.Error())
		note.Tags = []tags.Tag{}
	}
	note.IsArchived = archivedAt.Valid
	note.IsDeleted = deletedAt.Valid
	note.IsPinned = pinnedAt.Valid

	return note, nil
}

func CreateNote(note Note) (Note, error) {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	defer tx.Rollback()

	query := `
		INSERT INTO
			notes (title, content)
		VALUES
			(?, ?)
		RETURNING
			note_id,
			title,
			content,
			SUBSTR(content, 0, 500) AS snippet,
			updated_at
	`

	row := tx.QueryRow(query, note.Title, note.Content)
	err = row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error creating note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	for _, tag := range note.Tags {
		if tag.TagID == -1 {
			query = `
				INSERT INTO
					tags (name)
				VALUES
					(?)
				RETURNING
					tag_id,
					name
			`

			row := tx.QueryRow(query, tag.Name)
			err := row.Scan(&tag.TagID, &tag.Name)
			if err != nil {
				err = fmt.Errorf("error creating tag: %w", err)
				slog.Error(err.Error())
				return note, err
			}
		}

		query := `
			INSERT INTO
				note_tags (note_id, tag_id)
			VALUES
				(?, ?)
		`
		_, err := tx.Exec(query, note.NoteID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error adding tags to note: %w", err)
			slog.Error(err.Error())
			return note, err
		}
	}

	var tagsJSON string
	query = `
		SELECT
			COALESCE(
				JSON_GROUP_ARRAY(JSON_OBJECT(
					'tagId', t.tag_id,
					'name', t.name
				)), '[]'
			) as tags_json
		FROM
			note_tags nt
		LEFT JOIN
			tags t ON nt.tag_id = t.tag_id
		WHERE
			nt.note_id = ?
		GROUP BY
			nt.note_id
	`
	row = tx.QueryRow(query, note.NoteID)
	err = row.Scan(&tagsJSON)

	if err == sql.ErrNoRows {
		note.Tags = []tags.Tag{}
	} else if err != nil {
		err = fmt.Errorf("error retrieving tags for note %d: %w", note.NoteID, err)
		slog.Error(err.Error())
		note.Tags = []tags.Tag{}
	} else {
		err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
			slog.Error(err.Error())
			note.Tags = []tags.Tag{}
		}
	}

	err = tx.Commit()

	if err != nil {
		err = fmt.Errorf("error creating note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	return note, nil
}

func UpdateNote(note Note) (Note, error) {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	defer tx.Rollback()

	query := `
		UPDATE
			notes
		SET
			title = ?,
			content = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE
			note_id = ?
		RETURNING
			note_id,
			title,
			content,
			SUBSTR(content, 0, 500) AS snippet,
			updated_at
	`

	row := tx.QueryRow(query, note.Title, note.Content, note.NoteID)
	err = row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error updating note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	query = `
		DELETE FROM
			note_tags
		WHERE
			note_id = ?
	`

	_, err = tx.Exec(query, note.NoteID)
	if err != nil {
		err = fmt.Errorf("error deleting tags: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	for _, tag := range note.Tags {
		if tag.TagID == -1 {
			query = `
				INSERT INTO
					tags (name)
				VALUES
					(?)
				RETURNING
					tag_id,
					name
			`

			row := tx.QueryRow(query, tag.Name)
			err := row.Scan(&tag.TagID, &tag.Name)
			if err != nil {
				err = fmt.Errorf("error creating tag: %w", err)
				slog.Error(err.Error())
				return note, err
			}
		}

		query := `
			INSERT INTO
				note_tags (note_id, tag_id)
			VALUES
				(?, ?)
		`
		_, err := tx.Exec(query, note.NoteID, tag.TagID)
		if err != nil {
			err = fmt.Errorf("error adding tags to note: %w", err)
			slog.Error(err.Error())
			return note, err
		}
	}

	var tagsJSON string
	query = `
		SELECT
			COALESCE(
				JSON_GROUP_ARRAY(JSON_OBJECT(
					'tagId', t.tag_id,
					'name', t.name
				)), '[]'
			) as tags_json
		FROM
			note_tags nt
		LEFT JOIN
			tags t ON nt.tag_id = t.tag_id
		WHERE
			nt.note_id = ?
		GROUP BY
			nt.note_id
	`
	row = tx.QueryRow(query, note.NoteID)
	err = row.Scan(&tagsJSON)
	if err != nil {
		err = fmt.Errorf("error retrieving tags for note %d: %w", note.NoteID, err)
		slog.Error(err.Error())
		note.Tags = []tags.Tag{}
	}
	err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
	if err != nil {
		err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
		slog.Error(err.Error())
		note.Tags = []tags.Tag{}
	}

	err = tx.Commit()

	if err != nil {
		err = fmt.Errorf("error updating note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	return note, nil
}

func ForceDeleteNote(noteID int) error {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return err
	}

	defer tx.Rollback()

	query := `
		DELETE FROM
			note_tags
		WHERE
			note_id = ?
	`

	_, err = tx.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error deleting tags: %w", err)
		slog.Error(err.Error())
		return err
	}

	query = `
		DELETE FROM
			notes
		WHERE
			note_id = ?
	`

	_, err = tx.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error deleting note: %w", err)
		slog.Error(err.Error())
		return err
	}

	err = tx.Commit()

	if err != nil {
		err = fmt.Errorf("error deleting note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func SoftDeleteNote(noteID int) error {
	query := `
		UPDATE
			notes
		SET
			archived_at = NULL,
			deleted_at = CURRENT_TIMESTAMP
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error soft deleting note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func RestoreDeletedNote(noteID int) error {
	query := `
		UPDATE
			notes
		SET
			deleted_at = NULL
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error restoring deleted note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func ArchiveNote(noteID int) error {
	query := `
		UPDATE
			notes
		SET
			archived_at = CURRENT_TIMESTAMP
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error archiving note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func UnarchiveNote(noteID int) error {
	query := `
		UPDATE
			notes
		SET
			archived_at = NULL
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error unarchiving note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func SearchNotes(term string, limit int) ([]Note, error) {
	notes := []Note{}

	query := `
		SELECT
			n.note_id,
			highlight(notes_search, 0, '<mark>', '</mark>') AS highlighted_title,
			highlight(notes_search, 1, '<mark>', '</mark>') AS highlighted_content,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.updated_at,
			n.archived_at,
			n.deleted_at,
			n.pinned_at
		FROM
			notes n
		JOIN
			notes_search ns ON n.note_id = ns.rowid
		WHERE
			notes_search MATCH ?
		ORDER BY
			-- Boosting by active notes, then archived, then deleted notes
			CASE
				WHEN n.archived_at IS NULL AND n.deleted_at IS NULL THEN 1
				WHEN archived_at IS NOT NULL THEN 2
				WHEN deleted_at  IS NOT NULL THEN 3
				ELSE 4
			END ASC,
			-- Then by BM25 rank within each group
			rank
		LIMIT
			?
	`

	// https://www.sqlite.org/fts5.html#fts5_column_filters
	rows, err := sqlite.DB.Query(query, "{title content}: "+term, limit)
	if err != nil {
		err = fmt.Errorf("error retrieving notes: %w", err)
		slog.Error(err.Error())
		return notes, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var archivedAt sql.NullTime
		var deletedAt sql.NullTime
		var pinnedAt sql.NullTime
		err = rows.Scan(&note.NoteID, &note.HighlightedTitle, &note.HighlightedContent, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &archivedAt, &deletedAt, &pinnedAt)
		if err != nil {
			err = fmt.Errorf("error scanning note: %w", err)
			slog.Error(err.Error())
			return notes, err
		}
		note.IsArchived = archivedAt.Valid
		note.IsDeleted = deletedAt.Valid
		note.IsPinned = pinnedAt.Valid
		notes = append(notes, note)
	}

	return notes, nil
}

func EmptyTrash(shouldOnlyClearExpired bool) error {
	var query string
	if shouldOnlyClearExpired {
		query = `
			SELECT
				note_id
			FROM
				notes
			WHERE
				deleted_at IS NOT NULL AND
				deleted_at < datetime('now', '-30 days')
		`
	} else {
		query = `
			SELECT
				note_id
			FROM
				notes
			WHERE
				deleted_at IS NOT NULL
		`
	}

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving trashed notes: %w", err)
		slog.Error(err.Error())
		return err
	}
	defer rows.Close()

	var noteIDs []int
	for rows.Next() {
		var noteID int
		err = rows.Scan(&noteID)
		if err != nil {
			err = fmt.Errorf("error scanning note ID: %w", err)
			slog.Error(err.Error())
			return err
		}
		noteIDs = append(noteIDs, noteID)
	}

	for _, noteID := range noteIDs {
		err = ForceDeleteNote(noteID)
		if err != nil {
			err = fmt.Errorf("error deleting trashed note %d: %w", noteID, err)
			slog.Error(err.Error())
			return err
		}
	}

	return nil
}

func PinNote(noteID int) error {
	query := `
		UPDATE
			notes
		SET
			pinned_at = CURRENT_TIMESTAMP
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error pinning note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func UnpinNote(noteID int) error {
	query := `
		UPDATE
			notes
		SET
			pinned_at = NULL
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error unpinning note: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func GetNotesWithImages() ([]Note, error) {
	var notes []Note
	query := `
		SELECT
			note_id,
			title,
			content,
			SUBSTR(content, 0, 500) AS snippet,
			updated_at,
			archived_at,
			deleted_at,
			pinned_at
		FROM
			notes
		WHERE
			deleted_at IS NULL
			AND content LIKE '%![%](/images/%'
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error querying notes: %w", err)
		slog.Error(err.Error())
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var archivedAt sql.NullTime
		var deletedAt sql.NullTime
		var pinnedAt sql.NullTime

		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &archivedAt, &deletedAt, &pinnedAt)
		if err != nil {
			err = fmt.Errorf("error scanning note: %w", err)
			slog.Error(err.Error())
			return nil, err
		}

		note.IsArchived = archivedAt.Valid
		note.IsDeleted = deletedAt.Valid
		note.IsPinned = pinnedAt.Valid
		note.Tags = []tags.Tag{}

		notes = append(notes, note)
	}

	return notes, nil
}
