package intelligence

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"zen/commons/ollama"
	"zen/commons/qdrant"
	"zen/commons/queue"
	"zen/commons/utils"
)

var isIntelligenceEnabled bool

type HealthStatus struct {
	IsEnabled         bool `json:"is_enabled"`
	IsOllamaAvailable bool `json:"is_ollama_available"`
	IsQDrantAvailable bool `json:"is_qdrant_available"`
}

type ProcessRequest struct {
	Content string `json:"content"`
}

type ProcessNoteResponse struct {
	IsSuccess bool     `json:"success"`
	Message   string   `json:"message"`
	ChunkIDs  []string `json:"chunk_ids,omitempty"`
}

type SemanticNoteResult struct {
	NoteID    int     `json:"noteId"`
	ChunkID   string  `json:"chunkId"`
	Title     string  `json:"title"`
	MatchText string  `json:"matchText"`
	Tags      []any   `json:"tags"`
	UpdatedAt string  `json:"updatedAt"`
	Score     float32 `json:"score"`
}

type SemanticImageResult struct {
	Filename    string  `json:"filename"`
	Description string  `json:"description"`
	Score       float32 `json:"score"`
}

type SemanticSearchResults struct {
	Results []qdrant.SearchResult
	Err     error
}

func init() {
	isIntelligenceEnabled = os.Getenv("INTELLIGENCE_ENABLED") == "true"

	if isIntelligenceEnabled {
		slog.Info("Intelligence service initialized")

		noteCollectionName := NOTE_COLLECTION_NAME
		err := qdrant.CreateCollection(noteCollectionName, 768)
		if err == nil {
			slog.Info("Collection created", "collection", noteCollectionName)
		}

		imageCollectionName := IMAGE_COLLECTION_NAME
		err = qdrant.CreateCollection(imageCollectionName, 768)
		if err == nil {
			slog.Info("Collection created", "collection", imageCollectionName)
		}
	}
}

func HandleAvailability(w http.ResponseWriter, r *http.Request) {
	isOllamaAvailable := ollama.IsHealthy() == nil
	isQdrantAvailable := qdrant.IsHealthy() == nil

	status := HealthStatus{
		IsEnabled:         isIntelligenceEnabled,
		IsOllamaAvailable: isOllamaAvailable,
		IsQDrantAvailable: isQdrantAvailable,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func HandleQueueStats(w http.ResponseWriter, r *http.Request) {
	if !isIntelligenceAvailable() {
		utils.SendErrorResponse(w, "INTELLIGENCE_UNAVAILABLE", "Intelligence features are not available", nil, http.StatusServiceUnavailable)
		return
	}

	stats, err := queue.GetAllQueueStats()
	if err != nil {
		utils.SendErrorResponse(w, "QUEUE_STATS_FAILED", "Failed to get queue statistics", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}
