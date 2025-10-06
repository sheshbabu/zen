package intelligence

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"zen/commons/queue"
	"zen/commons/utils"
)

var isIntelligenceEnabled bool

type HealthStatus struct {
	IsEnabled   bool `json:"is_enabled"`
	IsAvailable bool `json:"is_available"`
}

func init() {
	isIntelligenceEnabled = os.Getenv("INTELLIGENCE_ENABLED") == "true"

	if isIntelligenceEnabled {
		slog.Info("intelligence feature enabled")
	}
}

func HandleAvailability(w http.ResponseWriter, r *http.Request) {
	isIntelligenceServiceAvailable := IsHealthy() == nil

	status := HealthStatus{
		IsEnabled:   isIntelligenceEnabled,
		IsAvailable: isIntelligenceServiceAvailable,
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

func HandleIndexAllContent(w http.ResponseWriter, r *http.Request) {
	if !isIntelligenceAvailable() {
		utils.SendErrorResponse(w, "INTELLIGENCE_UNAVAILABLE", "Intelligence features are not available", nil, http.StatusServiceUnavailable)
		return
	}

	slog.Info("starting content indexing for all notes and images")

	var totalTasks int

	noteTasks, err := indexAllNotes()
	if err != nil {
		utils.SendErrorResponse(w, "INDEXING_FAILED", "Failed to index notes", err, http.StatusInternalServerError)
		return
	}
	totalTasks += noteTasks
	slog.Info("added note indexing tasks to queue", "count", noteTasks)

	imageTasks, err := indexAllImages()
	if err != nil {
		utils.SendErrorResponse(w, "INDEXING_FAILED", "Failed to index images", err, http.StatusInternalServerError)
		return
	}
	totalTasks += imageTasks
	slog.Info("added image indexing tasks to queue", "count", imageTasks)

	slog.Info("content indexing initiated", "totalTasks", totalTasks)
	tasksAdded := totalTasks

	response := map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Content indexing initiated. Added %d tasks to queue.", tasksAdded),
	}

	ProcessQueues()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
