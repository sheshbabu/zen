package intelligence

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

var baseURL string
var httpClient *http.Client

const CLIENT_TIMEOUT = 5 * time.Minute

type EmbedNoteRequest struct {
	Title     string   `json:"title"`
	Content   string   `json:"content"`
	Tags      []string `json:"tags"`
	UpdatedAt string   `json:"updated_at"`
}

type EmbedImageRequest struct {
	Filename    string  `json:"filename"`
	ImagePath   string  `json:"image_path"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	AspectRatio float64 `json:"aspect_ratio"`
	FileSize    int64   `json:"file_size"`
	Format      string  `json:"format"`
}

type SearchRequest struct {
	Query string `json:"query"`
	Limit int    `json:"limit"`
}

type NoteSearchResponse struct {
	Results []SemanticNoteResult `json:"results"`
}

type ImageSearchResponse struct {
	Results []SemanticImageResult `json:"results"`
}

func init() {
	baseURL = os.Getenv("ZEN_INTELLIGENCE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8001"
	}

	httpClient = &http.Client{
		Timeout: CLIENT_TIMEOUT,
	}
}

func EmbedNote(noteID int, title, content string, tags []string, updatedAt string) error {
	req := EmbedNoteRequest{
		Title:     title,
		Content:   content,
		Tags:      tags,
		UpdatedAt: updatedAt,
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal note embed payload: %w", err)
	}

	url := fmt.Sprintf("%s/embed/notes/%d", baseURL, noteID)
	resp, err := httpClient.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to embed note: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to embed note: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func EmbedImage(filename, imagePath string, width int, height int, aspectRatio float64, fileSize int64, format string) error {
	req := EmbedImageRequest{
		Filename:    filename,
		ImagePath:   imagePath,
		Width:       width,
		Height:      height,
		AspectRatio: aspectRatio,
		FileSize:    fileSize,
		Format:      format,
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal image embed payload: %w", err)
	}

	url := fmt.Sprintf("%s/embed/images/%s", baseURL, filename)
	resp, err := httpClient.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to embed image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to embed image: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func DeleteNoteEmbeddings(noteID int) error {
	url := fmt.Sprintf("%s/embed/notes/%d", baseURL, noteID)
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete embed request: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete note embeddings: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete note embeddings: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func DeleteImageEmbeddings(filename string) error {
	url := fmt.Sprintf("%s/embed/images/%s", baseURL, filename)
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete embed request: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete image embeddings: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete image embeddings: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func SearchNotes(query string, limit int) ([]SemanticNoteResult, error) {
	req := SearchRequest{
		Query: query,
		Limit: limit,
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search payload: %w", err)
	}

	url := fmt.Sprintf("%s/search/notes", baseURL)
	resp, err := httpClient.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to search notes: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to search notes: status %d, body: %s", resp.StatusCode, string(body))
	}

	var searchResponse NoteSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResponse); err != nil {
		return nil, fmt.Errorf("failed to decode search response: %w", err)
	}

	return searchResponse.Results, nil
}

func SearchImages(query string, limit int) ([]SemanticImageResult, error) {
	req := SearchRequest{
		Query: query,
		Limit: limit,
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search payload: %w", err)
	}

	url := fmt.Sprintf("%s/search/images", baseURL)
	resp, err := httpClient.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to search images: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to search images: status %d, body: %s", resp.StatusCode, string(body))
	}

	var searchResponse ImageSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResponse); err != nil {
		return nil, fmt.Errorf("failed to decode search response: %w", err)
	}

	return searchResponse.Results, nil
}

func IsHealthy() error {
	url := fmt.Sprintf("%s/health", baseURL)
	resp, err := httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("failed to check health: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("intelligence service unhealthy: status %d", resp.StatusCode)
	}

	return nil
}
