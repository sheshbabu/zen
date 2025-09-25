package intelligence

import (
	"errors"
	"fmt"
	"log/slog"
	"net"
	"zen/commons/ollama"
	"zen/commons/qdrant"
	"zen/features/images"

	"github.com/google/uuid"
)

const IMAGE_ANALYSIS_PROMPT = "Generate a caption with all details of this image. Extract text if it exists. Do not add any introductory phrases like \"The image shows\" or \"This is a photo of\""
const IMAGE_FALLBACK_PROMPT = "Generate a caption with all details of this image. Do not add any introductory phrases like \"The image shows\" or \"This is a photo of\""

func ProcessImageForEmbedding(filename string) error {
	if !isIntelligenceAvailable() {
		return fmt.Errorf("intelligence features are not available")
	}

	err := DeleteImageEmbeddings(filename)
	if err != nil {
		slog.Error("Failed to delete existing image embeddings", "filename", filename, "error", err)
		return fmt.Errorf("failed to delete existing embeddings: %w", err)
	}

	description, err := analyzeImage(filename)
	if err != nil {
		slog.Error("Failed to analyze image", "filename", filename, "error", err)
		return fmt.Errorf("failed to analyze image: %w", err)
	}

	embedding, err := ollama.GenerateEmbedding(EMBEDDING_MODEL, description)
	if err != nil {
		slog.Error("Failed to generate embedding for image", "filename", filename, "error", err)
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	err = storeImageEmbedding(filename, description, embedding)
	if err != nil {
		slog.Error("Failed to store image embedding", "filename", filename, "error", err)
		return fmt.Errorf("failed to store embedding: %w", err)
	}

	return nil
}

func analyzeImage(filename string) (string, error) {
	resizeOptions := images.ResizeOptions{
		MaxSize: MAX_IMAGE_SIZE,
		Quality: 95,
	}
	imageData, err := images.ResizeImage(filename, resizeOptions)
	if err != nil {
		return "", fmt.Errorf("failed to resize image: %w", err)
	}

	response, err := ollama.ChatCompletion(VISION_MODEL, "", IMAGE_ANALYSIS_PROMPT, imageData)
	if err != nil {
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			slog.Error("Timeout while analyzing image, stopping model and retrying with fallback", "filename", filename, "error", err)

			// Stop the model to free up resources
			if stopErr := ollama.StopModel(VISION_MODEL); stopErr != nil {
				slog.Error("Failed to stop model after timeout", "model", VISION_MODEL, "error", stopErr)
			}

			// Retry with fallback prompt
			slog.Info("retrying image analysis with fallback prompt", "filename", filename)
			response, err = ollama.ChatCompletion(VISION_MODEL, "", IMAGE_FALLBACK_PROMPT, imageData)
			if err != nil {
				return "", fmt.Errorf("fallback image analysis failed: %w", err)
			}
		} else {
			return "", fmt.Errorf("failed to analyze image: %w", err)
		}
	}

	return response.Message.Content, nil
}

func storeImageEmbedding(filename, description string, embedding qdrant.Embedding) error {
	collectionName := IMAGE_COLLECTION_NAME
	pointID := uuid.New().String()

	payload := map[string]any{
		"description": description,
		"filename":    filename,
	}

	return qdrant.UpsertPoints(collectionName, []qdrant.Point{{
		ID:      pointID,
		Vector:  embedding,
		Payload: payload,
	}})
}

func DeleteImageEmbeddings(filename string) error {
	collectionName := IMAGE_COLLECTION_NAME
	filter := map[string]any{
		"must": []map[string]any{
			{
				"key":   "filename",
				"match": map[string]any{"value": filename},
			},
		},
	}

	results, err := qdrant.ScrollPoints(collectionName, filter, 1000)
	if err != nil {
		slog.Error("Failed to search points for deletion", "filename", filename, "collectionName", collectionName, "error", err)
		return fmt.Errorf("failed to search points for deletion: %w", err)
	}

	if len(results) == 0 {
		return nil
	}

	pointIDs := make([]string, len(results))
	for i, result := range results {
		pointIDs[i] = result.ID
	}

	err = qdrant.DeletePoints(collectionName, pointIDs)
	if err != nil {
		slog.Error("Failed to delete image embeddings from QDrant", "filename", filename, "error", err)
		return fmt.Errorf("failed to delete image embeddings: %w", err)
	}

	slog.Info("deleted image embeddings", "filename", filename)
	return nil
}
