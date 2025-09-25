package intelligence

import "time"

// Models
const CHUNKING_MODEL = "gemma3:12b-it-qat"
const EMBEDDING_MODEL = "nomic-embed-text:latest"
const VISION_MODEL = "qwen2.5vl:7b"

// Qdrant
const NOTE_COLLECTION_NAME = "notes_v1"
const IMAGE_COLLECTION_NAME = "images_v1"

// Search
const SEMANTIC_SCORE_THRESHOLD = 0.5

// Image Analysis
const MAX_IMAGE_SIZE = 512

// Timeouts
const SEARCH_TIMEOUT = 200 * time.Millisecond
