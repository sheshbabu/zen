package intelligence

import (
	"fmt"
	"log/slog"
	"math"
	"regexp"
	"strings"
	"zen/commons/qdrant"
	"zen/features/notes"
)

const MIN_CHUNK_LENGTH = 200
const CHUNK_BREAK_THRESHOLD = 0.5
const MIN_SENTENCES_PER_CHUNK = 2
const MAX_SENTENCES_PER_CHUNK = 10

var (
	markdownUrlRegex = regexp.MustCompile(`!?\[([^\]]*)\]\([^)]+\)`)
	urlRegex         = regexp.MustCompile(`https?://[^\s]+`)
	codeFenceRegex   = regexp.MustCompile(`(?s)` + "```[^`]*```")
	inlineCodeRegex  = regexp.MustCompile("`[^`]+`")
	sentenceRegex    = regexp.MustCompile(`[.?!]\s+`)
)

func ChunkNote(note notes.Note) ([]string, error) {
	if strings.TrimSpace(note.Content) == "" {
		slog.Debug("note content is empty, skipping chunking", "noteID", note.NoteID)
		return []string{}, nil
	}

	content := filterUrls(note.Content)
	content = filterCodeBlocks(content)
	content = strings.TrimSpace(content)

	if content == "" {
		slog.Debug("note content is empty after filtering, skipping chunking", "noteID", note.NoteID)
		return []string{}, nil
	}

	slog.Debug("chunking note", "noteID", note.NoteID, "originalLength", len(note.Content), "filteredLength", len(content))

	chunks, err := splitBySemanticSimilarity(content)
	if err != nil {
		return nil, err
	}

	if len(chunks) == 0 {
		return []string{content}, nil
	}

	return chunks, nil
}

func filterUrls(content string) string {
	// Markdown URLs [text](url) or ![alt](url)
	content = markdownUrlRegex.ReplaceAllString(content, "$1")
	// Standalone URLs
	content = urlRegex.ReplaceAllString(content, "")
	return content
}

func filterCodeBlocks(content string) string {
	// Remove fenced code blocks (```lang\ncode\n``` or ```\ncode\n```)
	content = codeFenceRegex.ReplaceAllString(content, "")
	// Remove inline code (`code`)
	content = inlineCodeRegex.ReplaceAllString(content, "")
	return content
}

func splitBySemanticSimilarity(content string) ([]string, error) {
	sentences := splitIntoSentences(content)
	if len(sentences) <= 1 {
		return []string{content}, nil
	}

	slog.Debug("starting semantic splitting", "sentences", len(sentences))

	embeddings := make([]qdrant.Embedding, len(sentences))
	for i, sentence := range sentences {
		embedding, err := embed(sentence)
		if err != nil {
			slog.Error("Failed to embed sentence", "sentence", sentence, "error", err)
			return nil, fmt.Errorf("failed to embed sentence %d: %w", i, err)
		}
		embeddings[i] = embedding
	}

	var chunks []string
	var currentChunk []string

	for i := 0; i < len(sentences); i++ {
		currentChunk = append(currentChunk, sentences[i])

		shouldBreakChunk := false

		if len(currentChunk) >= MAX_SENTENCES_PER_CHUNK {
			shouldBreakChunk = true
		}

		if i < len(sentences)-1 {
			similarity := calcCosineSimilarity(embeddings[i], embeddings[i+1])
			slog.Debug("sentence similarity", "current", sentences[i], "next", sentences[i+1], "similarity", similarity)
			if similarity < CHUNK_BREAK_THRESHOLD {
				shouldBreakChunk = true
			}
		}

		// Break if last sentence
		if i == len(sentences)-1 {
			shouldBreakChunk = true
		}

		if !shouldBreakChunk {
			continue
		}

		if len(currentChunk) >= MIN_SENTENCES_PER_CHUNK {
			chunk := strings.Join(currentChunk, " ")
			chunks = append(chunks, strings.TrimSpace(chunk))
			currentChunk = []string{}
			continue
		}

		// Too few sentences but we're at the end
		if len(currentChunk) < MIN_SENTENCES_PER_CHUNK && i == len(sentences)-1 {
			chunk := strings.Join(currentChunk, " ")
			chunk = strings.TrimSpace(chunk)
			if len(chunks) > 0 {
				chunks[len(chunks)-1] += " " + chunk
			} else {
				chunks = append(chunks, chunk)
			}
			currentChunk = []string{}
		}
	}

	// Cleanup
	if len(currentChunk) > 0 {
		if len(chunks) > 0 && len(currentChunk) < MIN_SENTENCES_PER_CHUNK {
			chunk := strings.Join(currentChunk, " ")
			chunks[len(chunks)-1] += " " + strings.TrimSpace(chunk)
		} else {
			chunk := strings.Join(currentChunk, " ")
			chunks = append(chunks, strings.TrimSpace(chunk))
		}
	}

	slog.Debug("completed semantic chunking", "sentences", len(sentences), "chunks", len(chunks))
	return chunks, nil
}

func splitIntoSentences(content string) []string {
	paragraphs := strings.Split(content, "\n")
	var allSentences []string

	for _, paragraph := range paragraphs {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph == "" {
			continue
		}

		sentences := splitParagraphIntoSentences(paragraph)
		allSentences = append(allSentences, sentences...)
	}

	return allSentences
}

func splitParagraphIntoSentences(paragraph string) []string {
	matches := sentenceRegex.FindAllStringIndex(paragraph, -1)

	if len(matches) == 0 {
		return []string{strings.TrimSpace(paragraph)}
	}

	var sentences []string
	start := 0

	for _, match := range matches {
		end := match[0] + 1 // include punctuation
		sentence := strings.TrimSpace(paragraph[start:end])
		if sentence != "" {
			sentences = append(sentences, sentence)
		}
		start = match[1]
	}

	if start < len(paragraph) {
		lastSentence := strings.TrimSpace(paragraph[start:])
		if lastSentence != "" {
			sentences = append(sentences, lastSentence)
		}
	}

	return sentences
}

func calcCosineSimilarity(a, b qdrant.Embedding) float64 {
	if len(a) != len(b) {
		return 0.0
	}

	var dotProduct, normA, normB float64
	for i := 0; i < len(a); i++ {
		dotProduct += float64(a[i]) * float64(b[i])
		normA += float64(a[i]) * float64(a[i])
		normB += float64(b[i]) * float64(b[i])
	}

	if normA == 0 || normB == 0 {
		return 0.0
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}
