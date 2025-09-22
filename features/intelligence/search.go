package intelligence

import (
	"fmt"
	"sort"
	"time"
	"zen/commons/qdrant"
)

func SemanticNoteSearch(query string, limit int) ([]SemanticNoteResult, error) {
	if !isIntelligenceAvailable() {
		return []SemanticNoteResult{}, nil
	}

	resultChan := make(chan SemanticSearchResults, 1)

	go func() {
		resultChan <- executeNoteVectorSearch(query, limit)
	}()

	var results []qdrant.SearchResult
	var err error

	select {
	case result := <-resultChan:
		results, err = result.Results, result.Err
	case <-time.After(200 * time.Millisecond):
		err = fmt.Errorf("note vector search timeout after 200ms")
	}

	if err != nil {
		return []SemanticNoteResult{}, err
	}

	return convertToNoteMatches(results), nil
}

func SemanticImageSearch(query string, limit int) ([]SemanticImageResult, error) {
	if !isIntelligenceAvailable() {
		return []SemanticImageResult{}, nil
	}

	resultChan := make(chan SemanticSearchResults, 1)

	go func() {
		resultChan <- executeImageVectorSearch(query, limit)
	}()

	var results []qdrant.SearchResult
	var err error

	select {
	case result := <-resultChan:
		results, err = result.Results, result.Err
	case <-time.After(200 * time.Millisecond):
		err = fmt.Errorf("image vector search timeout after 200ms")
	}

	if err != nil {
		return []SemanticImageResult{}, err
	}

	return convertToImageMatches(results), nil
}

func executeNoteVectorSearch(query string, limit int) SemanticSearchResults {
	queryEmbedding, err := embed(query)
	if err != nil {
		return SemanticSearchResults{Results: nil, Err: err}
	}

	collectionName := NOTE_COLLECTION_NAME
	results, err := qdrant.SearchSimilar(collectionName, queryEmbedding, limit, nil)
	if err != nil {
		return SemanticSearchResults{Results: nil, Err: fmt.Errorf("failed to search similar note vectors: %w", err)}
	}

	return SemanticSearchResults{Results: results, Err: nil}
}

func executeImageVectorSearch(query string, limit int) SemanticSearchResults {
	queryEmbedding, err := embed(query)
	if err != nil {
		return SemanticSearchResults{Results: nil, Err: err}
	}

	collectionName := IMAGE_COLLECTION_NAME
	results, err := qdrant.SearchSimilar(collectionName, queryEmbedding, limit, nil)
	if err != nil {
		return SemanticSearchResults{Results: nil, Err: fmt.Errorf("failed to search similar image vectors: %w", err)}
	}

	return SemanticSearchResults{Results: results, Err: nil}
}

func convertToNoteMatches(results []qdrant.SearchResult) []SemanticNoteResult {
	noteMap := make(map[int]*SemanticNoteResult)

	for _, result := range results {
		match := extractNoteMatch(result)
		if match != nil && match.Score >= SEMANTIC_SCORE_THRESHOLD {
			existing, exists := noteMap[match.NoteID]
			if !exists || match.Score > existing.Score {
				noteMap[match.NoteID] = match
			}
		}
	}

	matches := make([]SemanticNoteResult, 0, len(noteMap))
	for _, match := range noteMap {
		matches = append(matches, *match)
	}

	// Sort by score (highest first)
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].Score > matches[j].Score
	})

	return matches
}

func convertToImageMatches(results []qdrant.SearchResult) []SemanticImageResult {
	imageMap := make(map[string]*SemanticImageResult)

	for _, result := range results {
		match := extractImageMatch(result)
		if match != nil && match.Score >= SEMANTIC_SCORE_THRESHOLD {
			existing, exists := imageMap[match.Filename]
			if !exists || match.Score > existing.Score {
				imageMap[match.Filename] = match
			}
		}
	}

	matches := make([]SemanticImageResult, 0, len(imageMap))
	for _, match := range imageMap {
		matches = append(matches, *match)
	}

	// Sort by score (highest first)
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].Score > matches[j].Score
	})

	return matches
}

func extractNoteMatch(result qdrant.SearchResult) *SemanticNoteResult {
	noteID, ok := result.Payload["note_id"].(float64)
	if !ok {
		return nil
	}

	text, ok := result.Payload["text"].(string)
	if !ok {
		return nil
	}

	chunkID, _ := result.Payload["chunk_id"].(string)
	title, _ := result.Payload["title"].(string)
	tags, _ := result.Payload["tags"].([]any)
	updatedAt, _ := result.Payload["updated_at"].(string)

	return &SemanticNoteResult{
		NoteID:    int(noteID),
		ChunkID:   chunkID,
		Title:     title,
		MatchText: text,
		Tags:      tags,
		UpdatedAt: updatedAt,
		Score:     result.Score,
	}
}

func extractImageMatch(result qdrant.SearchResult) *SemanticImageResult {
	description, ok := result.Payload["description"].(string)
	if !ok {
		return nil
	}

	filename, _ := result.Payload["filename"].(string)
	if filename == "" {
		filename = "Unknown Image"
	}

	return &SemanticImageResult{
		Filename:    filename,
		Description: description,
		Score:       result.Score,
	}
}
