package search

import (
	"encoding/json"
	"net/http"
	"zen/commons/utils"
	"zen/features/intelligence"
	"zen/features/notes"
	"zen/features/tags"
)

const LIMIT = 20

type SearchResults struct {
	LexicalNotes   []notes.Note                       `json:"lexical_notes"`
	SemanticNotes  []intelligence.SemanticNoteResult  `json:"semantic_notes"`
	SemanticImages []intelligence.SemanticImageResult `json:"semantic_images"`
	Tags           []tags.Tag                         `json:"tags"`
}

type LexicalNoteSearchResults struct {
	Notes []notes.Note
	Err   error
}

type TagSearchResults struct {
	Tags []tags.Tag
	Err  error
}

func HandleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		utils.SendErrorResponse(w, "INVALID_SEARCH_QUERY", "Search query is required", nil, http.StatusBadRequest)
		return
	}

	lexicalNotesChan := make(chan LexicalNoteSearchResults, 1)
	tagsChan := make(chan TagSearchResults, 1)
	semanticNotesChan := make(chan []intelligence.SemanticNoteResult, 1)
	semanticImagesChan := make(chan []intelligence.SemanticImageResult, 1)

	// Run all searches in parallel
	go func() {
		searchNotes, err := notes.SearchNotes(query, LIMIT)
		lexicalNotesChan <- LexicalNoteSearchResults{Notes: searchNotes, Err: err}
	}()

	go func() {
		searchTags, err := tags.SearchTags(query)
		tagsChan <- TagSearchResults{Tags: searchTags, Err: err}
	}()

	go func() {
		semanticNotes, _ := intelligence.SemanticNoteSearch(query, LIMIT)
		semanticNotesChan <- semanticNotes
	}()

	go func() {
		semanticImages, _ := intelligence.SemanticImageSearch(query, LIMIT)
		semanticImagesChan <- semanticImages
	}()

	// Collect all results
	notesResult := <-lexicalNotesChan
	tagsResult := <-tagsChan
	semanticNotes := <-semanticNotesChan
	semanticImages := <-semanticImagesChan

	if notesResult.Err != nil {
		utils.SendErrorResponse(w, "NOTES_SEARCH_FAILED", "Error searching notes.", notesResult.Err, http.StatusInternalServerError)
		return
	}

	if tagsResult.Err != nil {
		utils.SendErrorResponse(w, "TAGS_SEARCH_FAILED", "Error searching tags.", tagsResult.Err, http.StatusInternalServerError)
		return
	}

	// Deduplicate vector notes - remove any that match FTS/lexical note IDs
	lexicalNoteIDs := make(map[int]bool)
	for _, note := range notesResult.Notes {
		lexicalNoteIDs[note.NoteID] = true
	}

	semanticNotesDeduped := make([]intelligence.SemanticNoteResult, 0, len(semanticNotes))
	for _, match := range semanticNotes {
		if !lexicalNoteIDs[match.NoteID] {
			semanticNotesDeduped = append(semanticNotesDeduped, match)
		}
	}

	results := SearchResults{
		LexicalNotes:   notesResult.Notes,
		SemanticNotes:  semanticNotesDeduped,
		SemanticImages: semanticImages,
		Tags:           tagsResult.Tags,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}
