package notes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"zen/commons/auth"
	"zen/commons/sqlite"
	"zen/features/tags"
)

const NOTES_LIMIT = 100

func GetAllNotes(access auth.Access, filter NotesFilter) ([]Note, int, error) {
	notes := []Note{}
	total := 0
	offset := (filter.page - 1) * NOTES_LIMIT

	scopePredicate, scopeArgs := buildReadableNotesPredicate(access)

	var query string
	var queryArgs []interface{}

	if filter.tagID != 0 {
		query = `
			SELECT
				n.note_id,
				n.title,
				n.content,
				SUBSTR(n.content, 0, 500) AS snippet,
				n.created_at,
				n.updated_at,
				COALESCE(
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t2.tag_id,
						'name', t2.name,
						'color', t2.color
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
			` + scopePredicate + `
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
		queryArgs = []interface{}{filter.tagID}
		queryArgs = append(queryArgs, scopeArgs...)
		queryArgs = append(queryArgs, NOTES_LIMIT, offset)
	} else if filter.focusModeID != 0 {
		query = `
			SELECT
				n.note_id,
				n.title,
				n.content,
				SUBSTR(n.content, 0, 500) AS snippet,
				n.created_at,
				n.updated_at,
				COALESCE(
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t.tag_id,
						'name', t.name,
						'color', t.color
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
			` + scopePredicate + `
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
		queryArgs = []interface{}{filter.focusModeID}
		queryArgs = append(queryArgs, scopeArgs...)
		queryArgs = append(queryArgs, NOTES_LIMIT, offset)
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
				n.created_at,
				n.updated_at,
				CASE
					WHEN COUNT(t.tag_id) > 0 THEN
						JSON_GROUP_ARRAY(JSON_OBJECT(
							'tagId', t.tag_id,
							'name', t.name,
							'color', t.color
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
		`, whereCondition, scopePredicate)
		queryArgs = []interface{}{}
		queryArgs = append(queryArgs, scopeArgs...)
		queryArgs = append(queryArgs, NOTES_LIMIT, offset)
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
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.CreatedAt, &note.UpdatedAt, &tagsJSON, &archivedAt, &deletedAt, &pinnedAt, &total)
		if err != nil {
			err = fmt.Errorf("error scanning note: %w", err)
			slog.Error(err.Error())
			return notes, total, err
		}
		if strings.TrimSpace(tagsJSON) == "" || tagsJSON == "null" {
			note.Tags = []tags.Tag{}
		} else {
			err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
			if err != nil {
				err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
				slog.Error(err.Error())
				note.Tags = []tags.Tag{}
			}
		}
		note.IsArchived = archivedAt.Valid
		note.IsDeleted = deletedAt.Valid
		note.IsPinned = pinnedAt.Valid
		notes = append(notes, note)
	}

	return notes, total, nil
}

func GetNoteByID(access auth.Access, noteID int) (Note, error) {
	var note Note
	var tagsJSON string
	var archivedAt sql.NullTime
	var deletedAt sql.NullTime

	scopePredicate, scopeArgs := buildReadableNotesPredicate(access)

	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(content, 0, 500) AS snippet,
			n.created_at,
			n.updated_at,
			CASE
				WHEN COUNT(t.tag_id) > 0 THEN
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t.tag_id,
						'name', t.name,
						'color', t.color
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
			` + scopePredicate + `
		GROUP BY
			n.note_id
	`

	queryArgs := []interface{}{noteID}
	queryArgs = append(queryArgs, scopeArgs...)

	row := sqlite.DB.QueryRow(query, queryArgs...)
	var pinnedAt sql.NullTime
	err := row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.CreatedAt, &note.UpdatedAt, &tagsJSON, &archivedAt, &deletedAt, &pinnedAt)
	if err != nil {
		err = fmt.Errorf("error retrieving note: %w", err)
		slog.Error(err.Error())
		return note, err
	}
	if strings.TrimSpace(tagsJSON) == "" || tagsJSON == "null" {
		note.Tags = []tags.Tag{}
	} else {
		err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
			slog.Error(err.Error())
			note.Tags = []tags.Tag{}
		}
	}
	note.IsArchived = archivedAt.Valid
	note.IsDeleted = deletedAt.Valid
	note.IsPinned = pinnedAt.Valid

	return note, nil
}

func CreateNote(access auth.Access, note Note) (Note, error) {
	tagIDs := []int{}
	for _, tag := range note.Tags {
		tagIDs = append(tagIDs, tag.TagID)
	}

	if !auth.CanWrite(access, tagIDs) {
		return note, auth.ErrForbidden
	}

	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	defer tx.Rollback()

	var query string
	var row *sql.Row

	if !note.UpdatedAt.IsZero() {
		query = `
			INSERT INTO
				notes (title, content, created_at, updated_at)
			VALUES
				(?, ?, ?, ?)
			RETURNING
				note_id,
				title,
				content,
				SUBSTR(content, 0, 500) AS snippet,
				updated_at
		`
		row = tx.QueryRow(query, note.Title, note.Content, note.CreatedAt, note.UpdatedAt)
	} else {
		query = `
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
		row = tx.QueryRow(query, note.Title, note.Content)
	}

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
					'name', t.name,
					'color', t.color
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

func UpdateNote(access auth.Access, note Note) (Note, error) {
	tx, err := sqlite.DB.Begin()

	if err != nil {
		err = fmt.Errorf("error starting transaction: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	defer tx.Rollback()

	existingTagIDs, err := getTagIDsForNote(tx, note.NoteID)
	if err != nil {
		return note, err
	}

	if !auth.CanWrite(access, existingTagIDs) {
		return note, auth.ErrForbidden
	}

	if !access.CanRetag {
		note.Tags = []tags.Tag{}
		for _, tagID := range existingTagIDs {
			note.Tags = append(note.Tags, tags.Tag{TagID: tagID})
		}
	}

	// Only snapshot when the text actually changes and every 5 mins
	query := `
		INSERT INTO
			note_versions (note_id, title, content)
		SELECT
			note_id,
			title,
			content
		FROM
			notes
		WHERE
			note_id = ? AND (title != ? OR content != ?)
			AND NOT EXISTS (
				SELECT
					1
				FROM
					note_versions
				WHERE
					note_id = ? AND created_at > datetime('now', ?)
			)
	`

	_, err = tx.Exec(query, note.NoteID, note.Title, note.Content, note.NoteID, VERSION_MIN_INTERVAL)
	if err != nil {
		err = fmt.Errorf("error creating note version: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	query = `
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
					'name', t.name,
					'color', t.color
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
	}
	if strings.TrimSpace(tagsJSON) == "" || tagsJSON == "null" {
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
			note_images
		WHERE
			note_id = ?
	`

	_, err = tx.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error deleting note images: %w", err)
		slog.Error(err.Error())
		return err
	}

	query = `
		DELETE FROM
			note_versions
		WHERE
			note_id = ?
	`

	_, err = tx.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error deleting note versions: %w", err)
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

const (
	SortRelevance = "relevance"
	SortUpdated   = "updated"
	SortCreated   = "created"
)

func SearchNotes(access auth.Access, term string, limit int, sort string) ([]Note, error) {
	notes := []Note{}

	scopePredicate, scopeArgs := buildReadableNotesPredicate(access)

	orderBy := "rank"
	if sort == SortUpdated {
		orderBy = "n.updated_at DESC"
	} else if sort == SortCreated {
		orderBy = "n.created_at DESC"
	}

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
			` + scopePredicate + `
		ORDER BY
			-- Boosting by active notes, then archived, then deleted notes
			CASE
				WHEN n.archived_at IS NULL AND n.deleted_at IS NULL THEN 1
				WHEN archived_at IS NOT NULL THEN 2
				WHEN deleted_at  IS NOT NULL THEN 3
				ELSE 4
			END ASC,
			-- Then by the chosen sort within each group
			` + orderBy + `
		LIMIT
			?
	`

	// https://www.sqlite.org/fts5.html#fts5_column_filters
	searchArgs := []interface{}{"{title content}: " + term}
	searchArgs = append(searchArgs, scopeArgs...)
	searchArgs = append(searchArgs, limit)

	rows, err := sqlite.DB.Query(query, searchArgs...)
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

func GetNotesCount(isDeleted, isArchived bool) (int, error) {
	var count int
	var query string

	if isDeleted {
		query = "SELECT COUNT(*) FROM notes WHERE deleted_at IS NOT NULL"
	} else if isArchived {
		query = "SELECT COUNT(*) FROM notes WHERE archived_at IS NOT NULL"
	} else {
		query = "SELECT COUNT(*) FROM notes WHERE deleted_at IS NULL AND archived_at IS NULL"
	}

	err := sqlite.DB.QueryRow(query).Scan(&count)
	if err != nil {
		err = fmt.Errorf("error getting notes count: %w", err)
		slog.Error(err.Error())
		return 0, err
	}

	return count, nil
}

// GetRelatedNotes returns notes sharing tags with the given note, ranked by how
// many tags they have in common. This is the tag-based fallback for the canvas
// sidebar's Suggested tab - it works with INTELLIGENCE_ENABLED off.
func GetRelatedNotes(noteID int, limit int) ([]Note, error) {
	notes := []Note{}

	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.created_at,
			n.updated_at,
			(
				SELECT COALESCE(
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tagId', t2.tag_id,
						'name', t2.name,
						'color', t2.color
					)), '[]'
				)
				FROM note_tags nt2
				JOIN tags t2 ON nt2.tag_id = t2.tag_id
				WHERE nt2.note_id = n.note_id
			) as tags_json,
			n.archived_at,
			n.deleted_at,
			n.pinned_at,
			COUNT(DISTINCT shared.tag_id) AS shared_count
		FROM
			notes n
		INNER JOIN
			note_tags shared ON n.note_id = shared.note_id
		WHERE
			shared.tag_id IN (SELECT tag_id FROM note_tags WHERE note_id = ?)
			AND n.note_id != ?
			AND n.deleted_at IS NULL
			AND n.archived_at IS NULL
		GROUP BY
			n.note_id
		ORDER BY
			shared_count DESC,
			n.updated_at DESC
		LIMIT
			?
	`

	rows, err := sqlite.DB.Query(query, noteID, noteID, limit)
	if err != nil {
		err = fmt.Errorf("error retrieving related notes: %w", err)
		slog.Error(err.Error())
		return notes, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var tagsJSON string
		var archivedAt sql.NullTime
		var deletedAt sql.NullTime
		var pinnedAt sql.NullTime
		var sharedCount int

		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.CreatedAt, &note.UpdatedAt, &tagsJSON, &archivedAt, &deletedAt, &pinnedAt, &sharedCount)
		if err != nil {
			err = fmt.Errorf("error scanning related note: %w", err)
			slog.Error(err.Error())
			return notes, err
		}

		if strings.TrimSpace(tagsJSON) == "" || tagsJSON == "null" {
			note.Tags = []tags.Tag{}
		} else {
			err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
			if err != nil {
				err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
				slog.Error(err.Error())
				note.Tags = []tags.Tag{}
			}
		}

		note.IsArchived = archivedAt.Valid
		note.IsDeleted = deletedAt.Valid
		note.IsPinned = pinnedAt.Valid
		notes = append(notes, note)
	}

	return notes, nil
}

const VERSIONS_LIMIT = 50

// Version pruning keeps the newest version per time window, widening the window as versions age.
// Notes with fewer versions than the threshold are skipped, so the scan only visits notes with enough history worth thinning.
const (
	VERSION_KEEP_ALL_AGE    = "-1 hour"
	VERSION_HOURLY_AGE      = "-7 days"
	VERSION_DAILY_AGE       = "-30 days"
	VERSION_PRUNE_THRESHOLD = 5
)

// Shortest gap between two snapshots of the same note
const VERSION_MIN_INTERVAL = "-5 minutes"

func GetNoteVersions(noteID int, page int) ([]NoteVersion, int, error) {
	versions := []NoteVersion{}
	total := 0
	offset := (page - 1) * VERSIONS_LIMIT

	query := `
		SELECT
			COUNT(*)
		FROM
			note_versions
		WHERE
			note_id = ?
	`

	row := sqlite.DB.QueryRow(query, noteID)
	err := row.Scan(&total)
	if err != nil {
		err = fmt.Errorf("error counting note versions: %w", err)
		slog.Error(err.Error())
		return versions, total, err
	}

	query = `
		SELECT
			version_id,
			note_id,
			title,
			content,
			created_at
		FROM
			note_versions
		WHERE
			note_id = ?
		ORDER BY
			created_at DESC,
			version_id DESC
		LIMIT
			?
		OFFSET
			?
	`

	rows, err := sqlite.DB.Query(query, noteID, VERSIONS_LIMIT, offset)
	if err != nil {
		err = fmt.Errorf("error retrieving note versions: %w", err)
		slog.Error(err.Error())
		return versions, total, err
	}
	defer rows.Close()

	for rows.Next() {
		var version NoteVersion
		err = rows.Scan(&version.VersionID, &version.NoteID, &version.Title, &version.Content, &version.CreatedAt)
		if err != nil {
			err = fmt.Errorf("error scanning note version: %w", err)
			slog.Error(err.Error())
			return versions, total, err
		}
		versions = append(versions, version)
	}

	return versions, total, nil
}

func GetNoteVersionByID(noteID int, versionID int) (NoteVersion, error) {
	var version NoteVersion

	query := `
		SELECT
			version_id,
			note_id,
			title,
			content,
			created_at
		FROM
			note_versions
		WHERE
			note_id = ? AND version_id = ?
	`

	row := sqlite.DB.QueryRow(query, noteID, versionID)
	err := row.Scan(&version.VersionID, &version.NoteID, &version.Title, &version.Content, &version.CreatedAt)
	if err != nil {
		err = fmt.Errorf("error retrieving note version: %w", err)
		slog.Error(err.Error())
		return version, err
	}

	return version, nil
}

func RestoreNoteVersion(noteID int, versionID int) (Note, error) {
	var note Note

	version, err := GetNoteVersionByID(noteID, versionID)
	if err != nil {
		return note, err
	}

	currentNote, err := GetNoteByID(auth.Unrestricted, noteID)
	if err != nil {
		return note, err
	}

	note.NoteID = noteID
	note.Title = version.Title
	note.Content = version.Content
	note.Tags = currentNote.Tags

	note, err = UpdateNote(auth.Unrestricted, note)
	if err != nil {
		return note, err
	}

	// UpdateNote's RETURNING clause doesn't populate these
	note.IsPinned = currentNote.IsPinned
	note.IsArchived = currentNote.IsArchived
	note.IsDeleted = currentNote.IsDeleted
	note.CreatedAt = currentNote.CreatedAt

	return note, nil
}

func PruneNoteVersions() error {
	query := `
		DELETE FROM note_versions WHERE version_id IN (
			SELECT version_id FROM (
				SELECT
					version_id,
					ROW_NUMBER() OVER (
						PARTITION BY note_id, CASE
							WHEN created_at > datetime('now', ?) THEN version_id
							WHEN created_at > datetime('now', ?) THEN strftime('%Y%m%d%H', created_at)
							WHEN created_at > datetime('now', ?) THEN strftime('%Y%m%d', created_at)
							ELSE strftime('%Y%W', created_at)
						END
						ORDER BY created_at DESC
					) AS rn
				FROM
					note_versions
				WHERE
					note_id IN (SELECT note_id FROM note_versions GROUP BY note_id HAVING COUNT(*) > ?)
			) WHERE rn > 1
		)
	`

	_, err := sqlite.DB.Exec(query, VERSION_KEEP_ALL_AGE, VERSION_HOURLY_AGE, VERSION_DAILY_AGE, VERSION_PRUNE_THRESHOLD)
	if err != nil {
		err = fmt.Errorf("error pruning note versions: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}

func getTagIDsForNote(tx *sql.Tx, noteID int) ([]int, error) {
	tagIDs := []int{}

	query := `
		SELECT
			tag_id
		FROM
			note_tags
		WHERE
			note_id = ?
	`

	rows, err := tx.Query(query, noteID)
	if err != nil {
		err = fmt.Errorf("error retrieving note tags: %w", err)
		slog.Error(err.Error())
		return tagIDs, err
	}
	defer rows.Close()

	for rows.Next() {
		var tagID int
		err = rows.Scan(&tagID)
		if err != nil {
			err = fmt.Errorf("error scanning note tag: %w", err)
			slog.Error(err.Error())
			return tagIDs, err
		}
		tagIDs = append(tagIDs, tagID)
	}

	return tagIDs, nil
}

// Notes with no tags match only when every tag is readable.
func buildReadableNotesPredicate(access auth.Access) (string, []interface{}) {
	if auth.CanReadAllTags(access) {
		return "", nil
	}

	tagPredicate, args := tags.BuildReadableTagsPredicate(access, "scoped_nt.tag_id")
	return "AND EXISTS (SELECT 1 FROM note_tags scoped_nt WHERE scoped_nt.note_id = n.note_id " + tagPredicate + ")", args
}
