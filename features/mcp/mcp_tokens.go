package mcp

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"zen/commons/utils"
)

type CreateTokenRequest struct {
	Name string `json:"name"`
}

type CreateTokenResponse struct {
	Token     string   `json:"token"`
	TokenInfo MCPToken `json:"tokenInfo"`
}

func HandleGetMCPTokens(w http.ResponseWriter, r *http.Request) {
	tokens, err := GetAllMCPTokens()
	if err != nil {
		utils.SendErrorResponse(w, "MCP_TOKENS_FETCH_FAILED", "Error fetching MCP tokens.", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tokens)
}

func HandleCreateMCPToken(w http.ResponseWriter, r *http.Request) {
	var req CreateTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendErrorResponse(w, "INVALID_REQUEST", "Invalid request body.", err, http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		utils.SendErrorResponse(w, "INVALID_TOKEN_NAME", "Token name is required.", nil, http.StatusBadRequest)
		return
	}

	plainToken, tokenInfo, err := CreateMCPToken(strings.TrimSpace(req.Name))
	if err != nil {
		utils.SendErrorResponse(w, "MCP_TOKEN_CREATE_FAILED", "Error creating MCP token.", err, http.StatusInternalServerError)
		return
	}

	response := CreateTokenResponse{
		Token:     plainToken,
		TokenInfo: tokenInfo,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func HandleRevokeMCPToken(w http.ResponseWriter, r *http.Request) {
	tokenIDStr := r.PathValue("tokenId")
	tokenID, err := strconv.Atoi(tokenIDStr)
	if err != nil {
		utils.SendErrorResponse(w, "INVALID_TOKEN_ID", "Invalid token ID.", err, http.StatusBadRequest)
		return
	}

	err = RevokeMCPToken(tokenID)
	if err != nil {
		utils.SendErrorResponse(w, "MCP_TOKEN_REVOKE_FAILED", "Error revoking MCP token.", err, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true}`))
}
