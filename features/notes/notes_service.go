package notes

import (
	"fmt"
	"log/slog"
	"zen/features/tags"
)

func assignTagsToNotes(allNotes []Note) error {
	allNoteIDs := make([]int, len(allNotes))
	for i, note := range allNotes {
		allNoteIDs[i] = note.NoteID
	}

	noteTagsMap, err := tags.GetNoteTagsMap(allNoteIDs)
	if err != nil {
		err = fmt.Errorf("error retrieving note tags: %w", err)
		slog.Error(err.Error())
		return err
	}

	for i, note := range allNotes {
		allNotes[i].Tags = noteTagsMap[note.NoteID]
	}

	return nil
}
