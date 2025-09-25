package intelligence

import (
	"sync"
	"zen/commons/ollama"
	"zen/commons/qdrant"
)

func isIntelligenceAvailable() bool {
	// Return early without making HTTP calls
	if !isIntelligenceEnabled {
		return false
	}

	var isOllamaAvailable, isQdrantAvailable bool
	var wg sync.WaitGroup

	wg.Add(2)

	go func() {
		defer wg.Done()
		isOllamaAvailable = ollama.IsHealthy() == nil
	}()

	go func() {
		defer wg.Done()
		isQdrantAvailable = qdrant.IsHealthy() == nil
	}()

	wg.Wait()

	return isOllamaAvailable && isQdrantAvailable
}
