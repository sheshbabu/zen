package notes

import (
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
)

func GetAllNotes(limit int, offset int) ([]Note, error) {
	var notes []Note
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

func CreateEmptyNote() (Note, error) {
	note, err := CreateNote(Note{})
	if err != nil {
		err = fmt.Errorf("error creating empty note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	return note, nil
}

func CreateNote(note Note) (Note, error) {
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

	row := sqlite.DB.QueryRow(query, note.Title, note.Content)
	err := row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
	if err != nil {
		err = fmt.Errorf("error creating note: %w", err)
		slog.Error(err.Error())
		return note, err
	}

	return note, nil
}

func UpdateNote(note Note) (Note, error) {
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

	row := sqlite.DB.QueryRow(query, note.Title, note.Content, note.NoteID)
	err := row.Scan(&note.NoteID, &note.Title, &note.Content, &note.Snippet, &note.UpdatedAt)
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
