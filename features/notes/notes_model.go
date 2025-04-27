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

func GetAllNotes(page int) ([]Note, int, error) {
	notes := []Note{}
	total := 0
	offset := (page - 1) * NOTES_LIMIT

	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.updated_at,
			CASE
				WHEN COUNT(t.tag_id) > 0 THEN
					JSON_GROUP_ARRAY(JSON_OBJECT(
						'tag_id', t.tag_id,
						'name', t.name
					))
				ELSE '[]'
			END AS tags_json,
			COUNT(*) OVER() as total_count
		FROM
			notes n
		LEFT JOIN
			note_tags nt ON n.note_id = nt.note_id
		LEFT JOIN
			tags t ON nt.tag_id = t.tag_id
		GROUP BY
            n.note_id
		ORDER BY
			n.updated_at DESC
		LIMIT
			?
		OFFSET
			?
	`

	rows, err := sqlite.DB.Query(query, NOTES_LIMIT, offset)
	if err != nil {
		err = fmt.Errorf("error retrieving notes: %w", err)
		slog.Error(err.Error())
		return notes, total, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var tagsJSON string
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &tagsJSON, &total)
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
		notes = append(notes, note)
	}

	return notes, total, nil
}

func GetNoteByID(noteID int) (Note, error) {
	var note Note
	var tagsJSON string

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
						'tag_id', t.tag_id,
						'name', t.name
					))
				ELSE '[]'
			END AS tags_json
		FROM
			notes n
		LEFT JOIN
			note_tags nt ON n.note_id = nt.note_id
		LEFT JOIN
			tags t ON nt.tag_id = t.tag_id
		WHERE
			n.note_id = ?
	`

	row := sqlite.DB.QueryRow(query, noteID)
	err := row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &tagsJSON)
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
					'tag_id', t.tag_id,
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
					'tag_id', t.tag_id,
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

func DeleteNote(noteID int) error {
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

func GetNotesByTagID(tagID int, page int) ([]Note, int, error) {
	notes := []Note{}
	total := 0
	offset := (page - 1) * NOTES_LIMIT

	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.updated_at,
			COALESCE(
				JSON_GROUP_ARRAY(JSON_OBJECT(
					'tag_id', t2.tag_id,
					'name', t2.name
				)), '[]'
			) as tags_json,
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
			t.tag_id = ?
		GROUP BY
			n.note_id
		ORDER BY
			n.updated_at DESC
		LIMIT
			?
		OFFSET
			?
	`

	rows, err := sqlite.DB.Query(query, tagID, NOTES_LIMIT, offset)
	if err != nil {
		err = fmt.Errorf("error retrieving notes: %w", err)
		slog.Error(err.Error())
		return notes, total, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var tagsJSON string
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &tagsJSON, &total)
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
		notes = append(notes, note)
	}

	return notes, total, nil
}

func GetNotesByFocusModeID(focusModeID int, page int) ([]Note, int, error) {
	notes := []Note{}
	total := 0
	offset := (page - 1) * NOTES_LIMIT

	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.updated_at,
			COALESCE(
                JSON_GROUP_ARRAY(JSON_OBJECT(
					'tag_id', t.tag_id,
					'name', t.name
				)), '[]'
            ) as tags_json,
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
			fmt.focus_mode_id = ?
		GROUP BY
            n.note_id
		ORDER BY
			n.updated_at DESC
		LIMIT
			?
		OFFSET
			?
	`

	rows, err := sqlite.DB.Query(query, focusModeID, NOTES_LIMIT, offset)
	if err != nil {
		err = fmt.Errorf("error retrieving notes by focus mode ID: %w", err)
		slog.Error(err.Error())
		return notes, total, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		var tagsJSON string
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt, &tagsJSON, &total)
		if err != nil {
			err = fmt.Errorf("error scanning note by focus mode ID: %w", err)
			slog.Error(err.Error())
			return notes, total, err
		}
		err = json.Unmarshal([]byte(tagsJSON), &note.Tags)
		if err != nil {
			err = fmt.Errorf("error unmarshaling tags for note %d: %w", note.NoteID, err)
			slog.Error(err.Error())
			note.Tags = []tags.Tag{}
		}
		notes = append(notes, note)
	}

	return notes, total, nil
}

func SearchNotes(term string, limit int) ([]Note, error) {
	notes := []Note{}

	query := `
		SELECT
			note_id,
			title,
			content,
			SUBSTR(content, 0, 500) AS snippet,
			updated_at
		FROM
			notes
		WHERE
			title LIKE ? OR content LIKE ?
		ORDER BY
			updated_at DESC
		LIMIT
			?
	`

	rows, err := sqlite.DB.Query(query, "%"+term+"%", "%"+term+"%", limit)
	if err != nil {
		err = fmt.Errorf("error retrieving notes: %w", err)
		slog.Error(err.Error())
		return notes, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
		if err != nil {
			err = fmt.Errorf("error scanning note: %w", err)
			slog.Error(err.Error())
			return notes, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}
