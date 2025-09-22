package intelligence

import (
	"zen/commons/ollama"
	"zen/commons/qdrant"
)

func isIntelligenceAvailable() bool {
	// Return early without making HTTP calls
	if !isIntelligenceEnabled {
		return false
	}

	isOllamaAvailable := ollama.IsHealthy() == nil
	isQdrantAvailable := qdrant.IsHealthy() == nil
	return isOllamaAvailable && isQdrantAvailable
}
