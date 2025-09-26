package intelligence

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"regexp"
	"strings"
	"zen/commons/ollama"
	"zen/features/notes"
)

const (
	MaxContentLength = 4000
	SingleChunkLimit = 1500
)

var (
	markdownUrlRegex = regexp.MustCompile(`!?\[([^\]]*)\]\([^)]+\)`)
	urlRegex         = regexp.MustCompile(`https?://[^\s]+`)
	headingRegex     = regexp.MustCompile(`(?m)^#{1,6}\s+.+$`)
	codeFenceRegex   = regexp.MustCompile(`(?s)` + "```[^`]*```")
	inlineCodeRegex  = regexp.MustCompile("`[^`]+`")
)

var chunkingPrompt string

func init() {
	content, err := os.ReadFile("features/intelligence/chunking_prompt.txt")
	if err != nil {
		chunkingPrompt = ""
	}
	chunkingPrompt = strings.TrimSpace(string(content))
}

// Short notes  -> No chunking
// Medium notes -> Semantic chunking (split by meaning, entity disambiguation)
// Long notes   -> Hierarchical recursive chunking (split by structure) -> Semantic chunking
func ChunkNote(note notes.Note) ([]string, error) {
	if note.Content == "" {
		slog.Info("note content is empty, skipping chunking", "noteID", note.NoteID)
		return []string{}, nil
	}

	content := filterUrls(note.Content)
	content = filterCodeBlocks(content)
	content = strings.TrimSpace(content)

	if content == "" {
		slog.Info("note content is empty after filtering, skipping chunking", "noteID", note.NoteID)
		return []string{}, nil
	}

	slog.Info("chunking note", "noteID", note.NoteID, "originalLength", len(note.Content), "filteredLength", len(content))

	// Short notes
	if len(content) <= SingleChunkLimit {
		slog.Info("note content is short, returning as single chunk", "noteID", note.NoteID, "length", len(content))
		return []string{content}, nil
	}

	// Medium notes
	if len(content)+len(chunkingPrompt) <= MaxContentLength {
		chunks, err := semanticChunk(content)
		if err != nil {
			return nil, err
		}

		if len(chunks) == 0 {
			return []string{note.Content}, nil
		}

		return chunks, nil
	}

	// Long notes
	slog.Info("note content exceeds max length, splitting into sections", "noteID", note.NoteID, "length", len(content))
	sections := splitLongContent(content)
	var allChunks []string

	for i, section := range sections {
		slog.Info("processing section", "noteID", note.NoteID, "section", i+1, "total sections", len(sections), "section length", len(section))
		sectionChunks, err := semanticChunk(section)
		if err != nil {
			slog.Error("Failed to chunk section", "noteID", note.NoteID, "section", i+1, "error", err)
			continue
		}
		allChunks = append(allChunks, sectionChunks...)
	}
	return allChunks, nil
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

func splitLongContent(content string) []string {
	var sections []string

	if headingRegex.MatchString(content) {
		slog.Info("splitting by headings")
		sections = splitByHeadings(content)
	} else {
		slog.Info("splitting by paragraphs")
		sections = splitByParagraphs(content)
	}

	var finalSections []string
	for _, section := range sections {
		if len(section)+len(chunkingPrompt) <= MaxContentLength {
			finalSections = append(finalSections, section)
		} else {
			subSections := splitLongParagraph(section)
			finalSections = append(finalSections, subSections...)
		}
	}

	// Fallback
	if len(finalSections) == 0 {
		return []string{content[:MaxContentLength]}
	}

	return finalSections
}

func splitByHeadings(content string) []string {
	lines := strings.Split(content, "\n")
	var sections []string
	var currentSection []string

	for _, line := range lines {
		if headingRegex.MatchString(line) && len(currentSection) > 0 {
			section := strings.TrimSpace(strings.Join(currentSection, "\n"))
			if section != "" {
				sections = append(sections, section)
			}
			currentSection = []string{line}
		} else {
			currentSection = append(currentSection, line)
		}
	}

	if len(currentSection) > 0 {
		section := strings.TrimSpace(strings.Join(currentSection, "\n"))
		if section != "" {
			sections = append(sections, section)
		}
	}

	return sections
}

func splitByParagraphs(content string) []string {
	paragraphs := strings.Split(content, "\n\n")
	var sections []string

	currentSection := ""
	for _, paragraph := range paragraphs {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph == "" {
			continue
		}

		testSection := currentSection
		if testSection != "" {
			testSection += "\n\n"
		}
		testSection += paragraph

		if len(testSection)+len(chunkingPrompt) <= MaxContentLength {
			currentSection = testSection
		} else {
			if currentSection != "" {
				sections = append(sections, currentSection)
			}
			currentSection = paragraph
		}
	}

	if currentSection != "" {
		sections = append(sections, currentSection)
	}

	return sections
}

func splitLongParagraph(paragraph string) []string {
	slog.Info("splitting by long paragraphs")
	sentences := strings.Split(paragraph, ". ")
	var sections []string

	currentSection := ""
	for i, sentence := range sentences {
		sentence = strings.TrimSpace(sentence)
		if sentence == "" {
			continue
		}

		if i < len(sentences)-1 && !strings.HasSuffix(sentence, ".") {
			sentence += "."
		}

		testSection := currentSection
		if testSection != "" {
			testSection += " "
		}
		testSection += sentence

		if len(testSection) <= MaxContentLength {
			currentSection = testSection
		} else {
			if currentSection != "" {
				sections = append(sections, currentSection)
			}
			currentSection = sentence
		}
	}

	if currentSection != "" {
		sections = append(sections, currentSection)
	}

	return sections
}

func semanticChunk(content string) ([]string, error) {
	userPrompt := chunkingPrompt + "\n\n" + content

	response, err := ollama.ChatCompletion(CHUNKING_MODEL, "", userPrompt)
	if err != nil {
		slog.Error("Chunking request failed", "model", CHUNKING_MODEL, "contentLength", len(content), "error", err)
		return nil, fmt.Errorf("error chunking: %w", err)
	}

	responseContent := response.Message.Content
	responseContent = cleanModelResponse(responseContent)

	var chunks []string
	if err := json.Unmarshal([]byte(responseContent), &chunks); err != nil {
		slog.Error("Failed to parse chunking response", "responseLength", len(responseContent), "response", responseContent, "error", err)
		return nil, fmt.Errorf("error parsing chunk response: %w", err)
	}

	return chunks, nil
}

func cleanModelResponse(content string) string {
	content = strings.TrimSpace(content)

	// Remove markdown code fences
	if len(content) >= 7 && content[:7] == "```json" {
		content = content[7:]
	}
	if len(content) >= 3 && content[len(content)-3:] == "```" {
		content = content[:len(content)-3]
	}

	// Remove model artifacts/tokens
	content = strings.ReplaceAll(content, "</end_of_turn>", "")
	content = strings.ReplaceAll(content, "end_of_turn>", "")

	// Replace invalid \' escapes with just ' inside JSON strings
	content = strings.ReplaceAll(content, "\\'", "'")

	// Also fix other common invalid JSON escapes
	content = strings.ReplaceAll(content, "\\`", "`")
	content = strings.ReplaceAll(content, "\\a", "a")
	content = strings.ReplaceAll(content, "\\e", "e")
	content = strings.ReplaceAll(content, "\\v", "v")
	content = strings.ReplaceAll(content, "\\0", "0")

	// Fix incomplete escape sequences at end of strings
	if strings.HasSuffix(content, "\\") && !strings.HasSuffix(content, "\\\\") {
		content = content[:len(content)-1]
	}

	return strings.TrimSpace(content)
}
