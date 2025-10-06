package intelligence


func isIntelligenceAvailable() bool {
	if !isIntelligenceEnabled {
		return false
	}

	isServiceHealthy := IsHealthy() == nil
	return isServiceHealthy
}
