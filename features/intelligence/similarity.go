package intelligence

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"zen/commons/utils"
)

func HandleSimilarImages(w http.ResponseWriter, r *http.Request) {
	filename := r.PathValue("filename")
	if filename == "" {
		utils.SendErrorResponse(w, "INVALID_REQUEST", "filename is required", nil, http.StatusBadRequest)
		return
	}

	if !isIntelligenceEnabled {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]SemanticImageResult{})
		return
	}

	results, err := FindSimilarImages(filename, 10, 0.5)
	if err != nil {
		slog.Error("failed to find similar images", "error", err, "filename", filename)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]SemanticImageResult{})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
