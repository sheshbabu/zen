package intelligence

import (
	"fmt"
	"time"
)

const SEARCH_TIMEOUT = 200 * time.Millisecond

type SemanticNoteResult struct {
	NoteID    int      `json:"noteId"`
	ChunkID   string   `json:"chunkId"`
	Title     string   `json:"title"`
	MatchText string   `json:"matchText"`
	Tags      []string `json:"tags"`
	UpdatedAt string   `json:"updatedAt"`
	Score     float32  `json:"score"`
}

type SemanticImageResult struct {
	Filename    string  `json:"filename"`
	Description string  `json:"description"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	AspectRatio float64 `json:"aspectRatio"`
	FileSize    int64   `json:"fileSize"`
	Format      string  `json:"format"`
	Score       float32 `json:"score"`
}

func SemanticNoteSearch(query string, limit int) ([]SemanticNoteResult, error) {
	if !isIntelligenceEnabled {
		return []SemanticNoteResult{}, nil
	}

	resultChan := make(chan []SemanticNoteResult, 1)
	errorChan := make(chan error, 1)

	go func() {
		results, err := SearchNotes(query, limit)
		if err != nil {
			errorChan <- err
			return
		}
		resultChan <- results
	}()

	select {
	case results := <-resultChan:
		return results, nil
	case err := <-errorChan:
		return []SemanticNoteResult{}, err
	case <-time.After(SEARCH_TIMEOUT):
		return []SemanticNoteResult{}, fmt.Errorf("note semantic search timeout")
	}
}

func SemanticImageSearch(query string, limit int) ([]SemanticImageResult, error) {
	if !isIntelligenceEnabled {
		return []SemanticImageResult{}, nil
	}

	resultChan := make(chan []SemanticImageResult, 1)
	errorChan := make(chan error, 1)

	go func() {
		results, err := SearchImages(query, limit)
		if err != nil {
			errorChan <- err
			return
		}
		resultChan <- results
	}()

	select {
	case results := <-resultChan:
		return results, nil
	case err := <-errorChan:
		return []SemanticImageResult{}, err
	case <-time.After(SEARCH_TIMEOUT):
		return []SemanticImageResult{}, fmt.Errorf("image semantic search timeout")
	}
}
