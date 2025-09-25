package intelligence

import (
	"fmt"
	"log/slog"
	"strconv"
	"zen/commons/qdrant"
	"zen/features/notes"

	"github.com/google/uuid"
)

func ProcessNoteForEmbedding(noteIDStr string) error {
	if !isIntelligenceAvailable() {
		return fmt.Errorf("intelligence features are not available")
	}

	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		return fmt.Errorf("invalid note ID: %w", err)
	}

	note, err := notes.GetNoteByID(noteID)
	if err != nil {
		return fmt.Errorf("failed to get note: %w", err)
	}

	if note.IsDeleted || note.IsArchived {
		slog.Info("skipping deleted or archived note", "noteID", noteID)
		return nil
	}

	err = DeleteNoteEmbeddings(noteIDStr)
	if err != nil {
		slog.Error("Failed to delete existing note embeddings", "noteID", noteID, "error", err)
		return fmt.Errorf("failed to delete existing embeddings: %w", err)
	}

	chunks, err := ChunkNote(note)
	if err != nil {
		slog.Error("Failed to chunk note", "noteID", noteID, "error", err)
		return fmt.Errorf("failed to chunk note: %w", err)
	}

	if len(chunks) == 0 {
		return nil
	}

	embeddings, err := EmbedChunks(chunks)
	if err != nil {
		slog.Error("Failed to embed chunks", "noteID", noteID, "error", err)
		return fmt.Errorf("failed to embed chunks: %w", err)
	}

	return storeNoteEmbeddings(note, chunks, embeddings)
}

func storeNoteEmbeddings(note notes.Note, chunks []string, embeddings []qdrant.Embedding) error {
	collectionName := NOTE_COLLECTION_NAME

	for i, chunk := range chunks {
		pointID := uuid.New().String()
		payload := map[string]any{
			"text":        chunk,
			"note_id":     note.NoteID,
			"chunk_index": i,
			"title":       note.Title,
			"tags":        note.Tags,
			"updated_at":  note.UpdatedAt,
		}

		err := qdrant.UpsertPoints(collectionName, []qdrant.Point{{
			ID:      pointID,
			Vector:  embeddings[i],
			Payload: payload,
		}})
		if err != nil {
			slog.Error("Failed to upsert embedding point", "noteID", note.NoteID, "pointID", pointID, "error", err)
			return fmt.Errorf("failed to upsert point %s: %w", pointID, err)
		}
	}

	return nil
}

func DeleteNoteEmbeddings(noteIDStr string) error {
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		return fmt.Errorf("invalid note ID: %w", err)
	}

	collectionName := NOTE_COLLECTION_NAME
	filter := map[string]any{
		"must": []map[string]any{
			{
				"key":   "note_id",
				"match": map[string]any{"value": noteID},
			},
		},
	}

	results, err := qdrant.ScrollPoints(collectionName, filter, 1000)
	if err != nil {
		slog.Error("Failed to search points for deletion", "noteID", noteID, "collectionName", collectionName, "error", err)
		return fmt.Errorf("failed to search points for deletion: %w", err)
	}

	if len(results) == 0 {
		return nil
	}

	pointIDs := make([]string, len(results))
	for i, result := range results {
		pointIDs[i] = result.ID
	}

	return qdrant.DeletePoints(collectionName, pointIDs)
}
