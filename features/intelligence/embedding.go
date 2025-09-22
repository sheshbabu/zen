package intelligence

import (
	"fmt"
	"log/slog"
	"zen/commons/ollama"
	"zen/commons/qdrant"
)

func EmbedChunks(chunks []string) ([]qdrant.Embedding, error) {
	if len(chunks) == 0 {
		return nil, fmt.Errorf("no chunks provided")
	}

	embeddings := make([]qdrant.Embedding, len(chunks))

	for i, chunk := range chunks {
		embedding, err := embed(chunk)
		if err != nil {
			slog.Error("Failed to embed chunk", "chunkIndex", i, "chunkText", chunk, "error", err)
			return nil, fmt.Errorf("failed to embed chunk %d: %w", i, err)
		}
		embeddings[i] = embedding
	}

	return embeddings, nil
}

func embed(text string) (qdrant.Embedding, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	embedding, err := ollama.GenerateEmbedding(EMBEDDING_MODEL, text)
	if err != nil {
		return nil, fmt.Errorf("embedding failed: %w", err)
	}

	return embedding, nil
}
