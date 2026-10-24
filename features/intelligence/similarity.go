package intelligence

import (
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
		utils.SendJSON(w, http.StatusOK, []SemanticImageResult{})
		return
	}

	results, err := FindSimilarImages(filename, 10, 0.5)
	if err != nil {
		slog.Error("failed to find similar images", "error", err, "filename", filename)
		utils.SendJSON(w, http.StatusOK, []SemanticImageResult{})
		return
	}

	utils.SendJSON(w, http.StatusOK, results)
}
