package mcp

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"zen/commons/utils"
	"zen/features/notes"
)

type Request struct {
	JsonRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

type Response struct {
	JsonRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

type Notification struct {
	JsonRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
}

type RPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type InitializeParams struct {
	ProtocolVersion string      `json:"protocolVersion"`
	Capabilities    interface{} `json:"capabilities"`
	ClientInfo      ClientInfo  `json:"clientInfo"`
}

type ClientInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type InitializeResult struct {
	ProtocolVersion string       `json:"protocolVersion"`
	Capabilities    Capabilities `json:"capabilities"`
	ServerInfo      ServerInfo   `json:"serverInfo"`
}

type ServerInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type Capabilities struct {
	Tools struct {
		ListChanged bool `json:"listChanged"`
	} `json:"tools"`
}

type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema interface{} `json:"inputSchema"`
}

type ToolListResult struct {
	Tools []Tool `json:"tools"`
}

type ToolCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments,omitempty"`
}

type ToolCallResult struct {
	Content []ToolContent `json:"content"`
	IsError bool          `json:"isError,omitempty"`
}

type ToolContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func validateAccessToken(r *http.Request) bool {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return false
	}

	if !strings.HasPrefix(authHeader, "Bearer ") {
		return false
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	return ValidateMCPToken(token)
}

func HandleMCP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id")
	w.Header().Set("Access-Control-Expose-Headers", "Mcp-Session-Id")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		utils.SendErrorResponse(w, "METHOD_NOT_ALLOWED", "Only POST method is supported", nil, http.StatusMethodNotAllowed)
		return
	}

	if !validateAccessToken(r) {
		utils.SendErrorResponse(w, "UNAUTHORIZED", "Valid access token required", nil, http.StatusUnauthorized)
		return
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendRPCError(w, nil, -32700, "Parse error", nil)
		return
	}

	response := handleMCPMessage(req)
	if response == nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func handleMCPMessage(req Request) interface{} {
	switch req.Method {
	case "initialize":
		return handleInitialize(req)
	case "notifications/initialized":
		return nil
	case "tools/list":
		return handleToolsList(req)
	case "tools/call":
		return handleToolsCall(req)
	default:
		return createErrorResponse(req.ID, -32601, "Method not found", nil)
	}
}

func handleInitialize(req Request) *Response {
	result := InitializeResult{
		ProtocolVersion: "2025-03-26",
		Capabilities: Capabilities{
			Tools: struct {
				ListChanged bool `json:"listChanged"`
			}{
				ListChanged: true,
			},
		},
		ServerInfo: ServerInfo{
			Name:    "Zen Notes MCP Server",
			Version: "1.0.0",
		},
	}

	return &Response{
		JsonRPC: "2.0",
		ID:      req.ID,
		Result:  result,
	}
}

func handleToolsList(req Request) *Response {
	tools := []Tool{
		{
			Name:        "search_notes",
			Description: "Search through notes using full-text search",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{
						"type":        "string",
						"description": "Search query to find notes",
					},
					"limit": map[string]interface{}{
						"type":        "number",
						"description": "Maximum number of results to return (default: 20)",
						"default":     20,
					},
				},
				"required": []string{"query"},
			},
		},
		{
			Name:        "list_notes",
			Description: "List notes with optional filtering",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"page": map[string]interface{}{
						"type":        "number",
						"description": "Page number for pagination (default: 1)",
						"default":     1,
					},
					"archived": map[string]interface{}{
						"type":        "boolean",
						"description": "Show archived notes (default: false)",
						"default":     false,
					},
					"deleted": map[string]interface{}{
						"type":        "boolean",
						"description": "Show deleted notes (default: false)",
						"default":     false,
					},
				},
				"required": []string{},
			},
		},
		{
			Name:        "get_note",
			Description: "Get a specific note by ID",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"noteId": map[string]interface{}{
						"type":        "number",
						"description": "The ID of the note to retrieve",
					},
				},
				"required": []string{"noteId"},
			},
		},
	}

	result := ToolListResult{Tools: tools}

	return &Response{
		JsonRPC: "2.0",
		ID:      req.ID,
		Result:  result,
	}
}

func handleToolsCall(req Request) *Response {
	var params ToolCallParams
	paramBytes, err := json.Marshal(req.Params)
	if err != nil {
		return createErrorResponse(req.ID, -32602, "Invalid params", err.Error())
	}

	if err := json.Unmarshal(paramBytes, &params); err != nil {
		return createErrorResponse(req.ID, -32602, "Invalid params", err.Error())
	}

	var result ToolCallResult

	switch params.Name {
	case "search_notes":
		result = handleSearchNotes(params.Arguments)
	case "list_notes":
		result = handleListNotes(params.Arguments)
	case "get_note":
		result = handleGetNote(params.Arguments)
	default:
		return createErrorResponse(req.ID, -32601, "Unknown tool", params.Name)
	}

	return &Response{
		JsonRPC: "2.0",
		ID:      req.ID,
		Result:  result,
	}
}

func handleSearchNotes(args map[string]interface{}) ToolCallResult {
	query, ok := args["query"].(string)
	if !ok || query == "" {
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "Error: query parameter is required"}},
			IsError: true,
		}
	}

	limit := 20
	if l, ok := args["limit"].(float64); ok {
		limit = int(l)
	}

	searchNotes, err := notes.SearchNotes(query, limit)
	if err != nil {
		slog.Error("MCP search error", "error", err)
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "Error searching notes: " + err.Error()}},
			IsError: true,
		}
	}

	if len(searchNotes) == 0 {
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "No notes found matching your search query."}},
		}
	}

	var text strings.Builder
	text.WriteString(fmt.Sprintf("Found %d notes:\n\n", len(searchNotes)))

	for i, note := range searchNotes {
		text.WriteString(fmt.Sprintf("%d. **%s** (ID: %d)\n", i+1, note.Title, note.NoteID))
		text.WriteString(fmt.Sprintf("   Updated: %s\n", note.UpdatedAt.Format("2006-01-02 15:04")))
		if len(note.Tags) > 0 {
			tagNames := make([]string, len(note.Tags))
			for j, tag := range note.Tags {
				tagNames[j] = tag.Name
			}
			text.WriteString(fmt.Sprintf("   Tags: %s\n", strings.Join(tagNames, ", ")))
		}
		text.WriteString(fmt.Sprintf("   Snippet: %s\n\n", note.Snippet))
	}

	return ToolCallResult{
		Content: []ToolContent{{Type: "text", Text: text.String()}},
	}
}

func handleListNotes(args map[string]interface{}) ToolCallResult {
	page := 1
	if p, ok := args["page"].(float64); ok {
		page = int(p)
	}

	archived := false
	if a, ok := args["archived"].(bool); ok {
		archived = a
	}

	deleted := false
	if d, ok := args["deleted"].(bool); ok {
		deleted = d
	}

	filter := notes.NewNotesFilter(page, 0, 0, deleted, archived)

	allNotes, total, err := notes.GetAllNotes(filter)
	if err != nil {
		slog.Error("MCP list notes error", "error", err)
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "Error listing notes: " + err.Error()}},
			IsError: true,
		}
	}

	if len(allNotes) == 0 {
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "No notes found."}},
		}
	}

	var text strings.Builder
	text.WriteString(fmt.Sprintf("Showing %d of %d notes (page %d):\n\n", len(allNotes), total, page))

	for i, note := range allNotes {
		status := ""
		if note.IsArchived {
			status = " [Archived]"
		} else if note.IsDeleted {
			status = " [Deleted]"
		}

		text.WriteString(fmt.Sprintf("%d. **%s**%s (ID: %d)\n", i+1, note.Title, status, note.NoteID))
		text.WriteString(fmt.Sprintf("   Updated: %s\n", note.UpdatedAt.Format("2006-01-02 15:04")))
		if len(note.Tags) > 0 {
			tagNames := make([]string, len(note.Tags))
			for j, tag := range note.Tags {
				tagNames[j] = tag.Name
			}
			text.WriteString(fmt.Sprintf("   Tags: %s\n", strings.Join(tagNames, ", ")))
		}
		text.WriteString(fmt.Sprintf("   Snippet: %s\n\n", note.Snippet))
	}

	return ToolCallResult{
		Content: []ToolContent{{Type: "text", Text: text.String()}},
	}
}

func handleGetNote(args map[string]interface{}) ToolCallResult {
	noteIDFloat, ok := args["noteId"].(float64)
	if !ok {
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "Error: noteId parameter is required"}},
			IsError: true,
		}
	}

	noteID := int(noteIDFloat)
	note, err := notes.GetNoteByID(noteID)
	if err != nil {
		slog.Error("MCP get note error", "error", err)
		return ToolCallResult{
			Content: []ToolContent{{Type: "text", Text: "Error retrieving note: " + err.Error()}},
			IsError: true,
		}
	}

	var text strings.Builder
	text.WriteString(fmt.Sprintf("**%s** (ID: %d)\n\n", note.Title, note.NoteID))
	text.WriteString(fmt.Sprintf("Updated: %s\n", note.UpdatedAt.Format("2006-01-02 15:04:05")))

	if len(note.Tags) > 0 {
		tagNames := make([]string, len(note.Tags))
		for i, tag := range note.Tags {
			tagNames[i] = tag.Name
		}
		text.WriteString(fmt.Sprintf("Tags: %s\n", strings.Join(tagNames, ", ")))
	}

	status := ""
	if note.IsArchived {
		status = " [Archived]"
	} else if note.IsDeleted {
		status = " [Deleted]"
	}
	if status != "" {
		text.WriteString(fmt.Sprintf("Status: %s\n", status))
	}

	text.WriteString("\n---\n\n")
	text.WriteString(note.Content)

	return ToolCallResult{
		Content: []ToolContent{{Type: "text", Text: text.String()}},
	}
}

func createErrorResponse(id interface{}, code int, message string, data interface{}) *Response {
	return &Response{
		JsonRPC: "2.0",
		ID:      id,
		Error: &RPCError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}
}

func sendRPCError(w http.ResponseWriter, id interface{}, code int, message string, data interface{}) {
	response := createErrorResponse(id, code, message, data)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
