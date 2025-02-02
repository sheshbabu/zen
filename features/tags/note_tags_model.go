package tags

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"zen/commons/sqlite"
)

func GetNoteTagsMap(noteIDs []int) (map[int][]Tag, error) {
	tagsMap := make(map[int][]Tag)

	var noteIDsStr []string
	for _, noteID := range noteIDs {
		noteIDsStr = append(noteIDsStr, strconv.Itoa(noteID))
	}

	query := fmt.Sprintf(`
		SELECT
			nt.note_id,
			t.tag_id,
			t.name
		FROM
			note_tags nt
		JOIN
			tags t ON nt.tag_id = t.tag_id
		WHERE
			nt.note_id IN (%s)
	`, strings.Join(noteIDsStr, ","))

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving note tags: %w", err)
		slog.Error(err.Error())
		return tagsMap, err
	}
	defer rows.Close()

	for rows.Next() {
		var noteID int
		var tag Tag
		err = rows.Scan(&noteID, &tag.TagID, &tag.Name)
		if err != nil {
			err = fmt.Errorf("error scanning note tag: %w", err)
			slog.Error(err.Error())
			return tagsMap, err
		}
		tagsMap[noteID] = append(tagsMap[noteID], tag)
	}

	return tagsMap, nil
}

func GetNoteTags(noteID int) ([]Tag, error) {
	var tags []Tag
	query := `
		SELECT
			t.tag_id,
			t.name
		FROM
			note_tags nt
		JOIN
			tags t ON nt.tag_id = t.tag_id
		WHERE
			nt.note_id = ?
	`

	rows, err := sqlite.DB.Query(query, noteID)
	if err != nil {
		err = fmt.Errorf("error retrieving note tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}
	defer rows.Close()

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.TagID, &tag.Name)
		if err != nil {
			err = fmt.Errorf("error scanning note tag: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func UpdateNoteTags(noteID int, tagIDs []string) ([]Tag, error) {
	var tags []Tag
	query := `
		DELETE FROM
			note_tags
		WHERE
			note_id = ?
	`

	_, err := sqlite.DB.Exec(query, noteID)
	if err != nil {
		err = fmt.Errorf("error updating note tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	query = `
		INSERT INTO
			note_tags (note_id, tag_id)
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

		_, err = sqlite.DB.Exec(query, noteID, tagID)
		if err != nil {
			err = fmt.Errorf("error updating note tags: %w", err)
			slog.Error(err.Error())
			return tags, err
		}
	}

	tags, err = GetNoteTags(noteID)
	if err != nil {
		err = fmt.Errorf("error updating note tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	return tags, nil
}

func AddNoteTag(noteID, tagID int) ([]Tag, error) {
	var tags []Tag

	query := `
		INSERT INTO
			note_tags (note_id, tag_id)
		VALUES
			(?, ?)
	`

	_, err := sqlite.DB.Exec(query, noteID, tagID)
	if err != nil {
		err = fmt.Errorf("error adding note tag: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	tags, err = GetNoteTags(noteID)
	if err != nil {
		err = fmt.Errorf("error updating note tags: %w", err)
		slog.Error(err.Error())
		return tags, err
	}

	return tags, nil
}
