package ollama

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const CONTEXT_LENGTH = 8192
const OLLAMA_TIMEOUT = 2 * time.Minute

var baseURL string
var httpClient *http.Client

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
	Options  *Options  `json:"options,omitempty"`
}

type Message struct {
	Role    string   `json:"role"`
	Content string   `json:"content"`
	Images  []string `json:"images,omitempty"`
}

type ChatResponse struct {
	Model              string  `json:"model"`
	CreatedAt          string  `json:"created_at"`
	Message            Message `json:"message"`
	Done               bool    `json:"done"`
	TotalDuration      int64   `json:"total_duration"`
	LoadDuration       int64   `json:"load_duration"`
	PromptEvalCount    int     `json:"prompt_eval_count"`
	PromptEvalDuration int64   `json:"prompt_eval_duration"`
	EvalCount          int     `json:"eval_count"`
	EvalDuration       int64   `json:"eval_duration"`
}

type EmbeddingRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type EmbeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

type Options struct {
	Temperature float32 `json:"temperature,omitempty"`
	TopP        float32 `json:"top_p,omitempty"`
	TopK        int     `json:"top_k,omitempty"`
	NumCtx      int     `json:"num_ctx,omitempty"`
}

type ModelInfo struct {
	Name      string       `json:"name"`
	Size      int64        `json:"size"`
	Digest    string       `json:"digest"`
	Details   ModelDetails `json:"details"`
	ExpiresAt string       `json:"expires_at"`
	SizeVram  int64        `json:"size_vram"`
}

type ModelDetails struct {
	Format            string   `json:"format"`
	Family            string   `json:"family"`
	Families          []string `json:"families"`
	ParameterSize     string   `json:"parameter_size"`
	QuantizationLevel string   `json:"quantization_level"`
}

type ListModelsResponse struct {
	Models []ModelInfo `json:"models"`
}

type StopRequest struct {
	Model     string `json:"model"`
	KeepAlive string `json:"keep_alive"`
}

func init() {
	baseURL = os.Getenv("OLLAMA_HOST")
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}

	httpClient = &http.Client{
		Timeout: OLLAMA_TIMEOUT,
	}
}

func ChatCompletion(model, systemPrompt, userPrompt string, imageData ...[]byte) (*ChatResponse, error) {
	userMessage := Message{Role: "user", Content: userPrompt}

	if len(imageData) > 0 {
		images := make([]string, len(imageData))
		for i, data := range imageData {
			images[i] = base64.StdEncoding.EncodeToString(data)
		}
		userMessage.Images = images
	}

	messages := []Message{userMessage}

	if systemPrompt != "" {
		messages = []Message{
			{Role: "system", Content: systemPrompt},
			userMessage,
		}
	}

	req := ChatRequest{
		Model:    model,
		Messages: messages,
		Stream:   false,
		Options: &Options{
			Temperature: 0.3,
			NumCtx:      CONTEXT_LENGTH,
		},
	}

	resp, err := request("POST", "/api/chat", req)
	if err != nil {
		return nil, fmt.Errorf("chat completion: %w", err)
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(resp, &chatResp); err != nil {
		return nil, fmt.Errorf("unmarshal chat response: %w", err)
	}

	return &chatResp, nil
}

func GenerateEmbedding(model, text string) ([]float32, error) {
	req := EmbeddingRequest{
		Model:  model,
		Prompt: text,
	}

	resp, err := request("POST", "/api/embeddings", req)
	if err != nil {
		return nil, fmt.Errorf("generate embedding: %w", err)
	}

	var embResp EmbeddingResponse
	if err := json.Unmarshal(resp, &embResp); err != nil {
		return nil, fmt.Errorf("unmarshal embedding response: %w", err)
	}

	return embResp.Embedding, nil
}

func ListModels() (*ListModelsResponse, error) {
	resp, err := request("GET", "/api/tags", nil)
	if err != nil {
		return nil, fmt.Errorf("list models: %w", err)
	}

	var listResp ListModelsResponse
	if err := json.Unmarshal(resp, &listResp); err != nil {
		return nil, fmt.Errorf("unmarshal models response: %w", err)
	}

	return &listResp, nil
}

func IsModelAvailable(modelName string) (bool, error) {
	models, err := ListModels()
	if err != nil {
		return false, fmt.Errorf("check model availability: %w", err)
	}

	for _, model := range models.Models {
		if model.Name == modelName {
			return true, nil
		}
	}

	return false, nil
}

func IsHealthy() error {
	_, err := request("GET", "/api/tags", nil)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	return nil
}

func StopModel(modelName string) error {
	req := StopRequest{
		Model:     modelName,
		KeepAlive: "0",
	}

	_, err := request("POST", "/api/generate", req)
	if err != nil {
		return fmt.Errorf("stop model: %w", err)
	}

	return nil
}

func request(method, endpoint string, body interface{}) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		jsonBytes, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBytes)
	}

	url := baseURL + endpoint
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}
