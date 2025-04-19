package notes

import (
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
)

func GetAllNotes(limit int, offset int) ([]Note, error) {
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
		ORDER BY
			updated_at DESC
		LIMIT
			?
		OFFSET
			?
	`

	rows, err := sqlite.DB.Query(query, limit, offset)
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

func GetNoteByID(noteID int) (Note, error) {
	var note Note
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
			note_id = ?
	`

	row := sqlite.DB.QueryRow(query, noteID)
	err := row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error retrieving note: %w", err)
		slog.Error(err.Error())
		return note, err
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

	err = tx.Commit()

	if err != nil {
		err = fmt.Errorf("error updating note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	return note, nil
}

func GetNotesByTagID(tagID int) ([]Note, error) {
	var notes []Note
	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.updated_at
		FROM
			notes n
		JOIN
			note_tags nt ON n.note_id = nt.note_id
		WHERE
			nt.tag_id = ?
		ORDER BY
			n.updated_at DESC
	`

	rows, err := sqlite.DB.Query(query, tagID)
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

func GetNotesByFocusModeID(focusModeID int) ([]Note, error) {
	var notes []Note
	query := `
		SELECT
			n.note_id,
			n.title,
			n.content,
			SUBSTR(n.content, 0, 500) AS snippet,
			n.updated_at
		FROM
			focus_mode_tags fmt
		JOIN
			note_tags nt ON fmt.tag_id = nt.tag_id
		JOIN
			notes n ON nt.note_id = n.note_id
		WHERE
			fmt.focus_mode_id = ?
		ORDER BY
			n.updated_at DESC
	`

	rows, err := sqlite.DB.Query(query, focusModeID)
	if err != nil {
		err = fmt.Errorf("error retrieving notes by focus mode ID: %w", err)
		slog.Error(err.Error())
		return notes, err
	}
	defer rows.Close()

	for rows.Next() {
		var note Note
		err = rows.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
		if err != nil {
			err = fmt.Errorf("error scanning note by focus mode ID: %w", err)
			slog.Error(err.Error())
			return notes, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}
