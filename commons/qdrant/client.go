package qdrant

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const QDRANT_TIMEOUT = 500 * time.Millisecond

var baseURL string
var httpClient *http.Client

type Embedding []float32

type CollectionInfo struct {
	Name   string           `json:"name"`
	Config CollectionConfig `json:"config"`
	Status string           `json:"status"`
}

type CollectionConfig struct {
	Params VectorParams `json:"params"`
}

type VectorParams struct {
	Size     int    `json:"size"`
	Distance string `json:"distance"`
}

type CreateCollectionRequest struct {
	Vectors VectorParams `json:"vectors"`
}

type Point struct {
	ID      string                 `json:"id,omitempty"`
	Vector  Embedding              `json:"vector"`
	Payload map[string]interface{} `json:"payload"`
}

type UpsertRequest struct {
	Points []Point `json:"points"`
}

type SearchRequest struct {
	Vector      Embedding              `json:"vector"`
	Limit       int                    `json:"limit"`
	WithPayload bool                   `json:"with_payload"`
	Filter      map[string]interface{} `json:"filter,omitempty"`
}

type SearchResult struct {
	ID      string                 `json:"id"`
	Score   float32                `json:"score"`
	Payload map[string]interface{} `json:"payload,omitempty"`
}

type SearchResponse struct {
	Result []SearchResult `json:"result"`
}

func init() {
	baseURL = os.Getenv("QDRANT_HOST")
	if baseURL == "" {
		baseURL = "http://localhost:6333"
	}

	httpClient = &http.Client{
		Timeout: QDRANT_TIMEOUT,
	}
}

func CreateCollection(name string, vectorSize int) error {
	req := CreateCollectionRequest{
		Vectors: VectorParams{
			Size:     vectorSize,
			Distance: "Cosine",
		},
	}

	endpoint := fmt.Sprintf("/collections/%s", name)
	_, err := request("PUT", endpoint, req)
	if err != nil {
		return fmt.Errorf("create collection: %w", err)
	}

	return nil
}

func GetCollection(name string) (*CollectionInfo, error) {
	endpoint := fmt.Sprintf("/collections/%s", name)
	resp, err := request("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("get collection: %w", err)
	}

	var response struct {
		Result CollectionInfo `json:"result"`
	}
	if err := json.Unmarshal(resp, &response); err != nil {
		return nil, fmt.Errorf("unmarshal collection info: %w", err)
	}

	return &response.Result, nil
}

func CollectionExists(name string) bool {
	_, err := GetCollection(name)
	return err == nil
}

func DeleteCollection(name string) error {
	endpoint := fmt.Sprintf("/collections/%s", name)
	_, err := request("DELETE", endpoint, nil)
	if err != nil {
		return fmt.Errorf("delete collection: %w", err)
	}

	return nil
}

func UpsertPoints(collectionName string, points []Point) error {
	if len(points) == 0 {
		return nil
	}

	req := UpsertRequest{
		Points: points,
	}

	endpoint := fmt.Sprintf("/collections/%s/points", collectionName)
	_, err := request("PUT", endpoint, req)
	if err != nil {
		return fmt.Errorf("upsert points: %w", err)
	}

	return nil
}

func SearchSimilar(collectionName string, vector Embedding, limit int, filter map[string]interface{}) ([]SearchResult, error) {
	req := SearchRequest{
		Vector:      vector,
		Limit:       limit,
		WithPayload: true,
		Filter:      filter,
	}

	endpoint := fmt.Sprintf("/collections/%s/points/search", collectionName)
	resp, err := request("POST", endpoint, req)
	if err != nil {
		return nil, fmt.Errorf("search similar: %w", err)
	}

	var response SearchResponse
	if err := json.Unmarshal(resp, &response); err != nil {
		return nil, fmt.Errorf("unmarshal search response: %w", err)
	}

	return response.Result, nil
}

func ScrollPoints(collectionName string, filter map[string]interface{}, limit int) ([]SearchResult, error) {
	req := map[string]interface{}{
		"filter":       filter,
		"limit":        limit,
		"with_payload": true,
	}

	endpoint := fmt.Sprintf("/collections/%s/points/scroll", collectionName)
	resp, err := request("POST", endpoint, req)
	if err != nil {
		return nil, fmt.Errorf("scroll points: %w", err)
	}

	var response struct {
		Result struct {
			Points []SearchResult `json:"points"`
		} `json:"result"`
	}
	if err := json.Unmarshal(resp, &response); err != nil {
		return nil, fmt.Errorf("unmarshal scroll response: %w", err)
	}

	return response.Result.Points, nil
}

func DeletePoints(collectionName string, pointIDs []string) error {
	if len(pointIDs) == 0 {
		return nil
	}

	req := map[string]interface{}{
		"points": pointIDs,
	}

	endpoint := fmt.Sprintf("/collections/%s/points/delete", collectionName)
	_, err := request("POST", endpoint, req)
	if err != nil {
		return fmt.Errorf("delete points: %w", err)
	}

	return nil
}

func IsHealthy() error {
	_, err := request("GET", "/", nil)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
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
