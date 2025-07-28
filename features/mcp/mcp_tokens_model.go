package mcp

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log/slog"
	"time"
	"zen/commons/sqlite"
)

type MCPToken struct {
	TokenID   int       `json:"tokenId"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	IsActive  bool      `json:"isActive"`
}

type MCPTokenRecord struct {
	TokenID   int
	Name      string
	TokenHash string
	CreatedAt time.Time
	IsActive  bool
}

func GetAllMCPTokens() ([]MCPToken, error) {
	tokens := []MCPToken{}

	query := `
		SELECT 
			token_id,
			name,
			created_at,
			is_active
		FROM 
			mcp_tokens 
		WHERE 
			is_active = 1
		ORDER BY 
			created_at DESC
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving MCP tokens: %w", err)
		slog.Error(err.Error())
		return tokens, err
	}
	defer rows.Close()

	for rows.Next() {
		var token MCPToken
		var isActiveInt int
		err = rows.Scan(&token.TokenID, &token.Name, &token.CreatedAt, &isActiveInt)
		if err != nil {
			err = fmt.Errorf("error scanning MCP token: %w", err)
			slog.Error(err.Error())
			return tokens, err
		}
		token.IsActive = isActiveInt == 1
		tokens = append(tokens, token)
	}

	return tokens, nil
}

func CreateMCPToken(name string) (string, MCPToken, error) {
	// Generate a secure random token
	tokenBytes := make([]byte, 24) // 32 characters when hex encoded
	_, err := rand.Read(tokenBytes)
	if err != nil {
		err = fmt.Errorf("error generating token: %w", err)
		slog.Error(err.Error())
		return "", MCPToken{}, err
	}

	plainToken := hex.EncodeToString(tokenBytes)

	// Hash the token for storage
	hasher := sha256.New()
	hasher.Write([]byte(plainToken))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))

	var token MCPToken
	query := `
		INSERT INTO 
			mcp_tokens (name, token_hash)
		VALUES 
			(?, ?)
		RETURNING 
			token_id, name, created_at, is_active
	`

	row := sqlite.DB.QueryRow(query, name, tokenHash)
	var isActiveInt int
	err = row.Scan(&token.TokenID, &token.Name, &token.CreatedAt, &isActiveInt)
	if err != nil {
		err = fmt.Errorf("error creating MCP token: %w", err)
		slog.Error(err.Error())
		return "", MCPToken{}, err
	}

	token.IsActive = isActiveInt == 1

	return plainToken, token, nil
}

func RevokeMCPToken(tokenID int) error {
	query := `
		UPDATE 
			mcp_tokens 
		SET 
			is_active = 0
		WHERE 
			token_id = ?
	`

	result, err := sqlite.DB.Exec(query, tokenID)
	if err != nil {
		err = fmt.Errorf("error revoking MCP token: %w", err)
		slog.Error(err.Error())
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		err = fmt.Errorf("error checking revoked token: %w", err)
		slog.Error(err.Error())
		return err
	}

	if rowsAffected == 0 {
		err = fmt.Errorf("MCP token not found")
		slog.Error(err.Error())
		return err
	}

	return nil
}

func ValidateMCPToken(plainToken string) bool {
	if plainToken == "" {
		return false
	}

	// Hash the incoming token
	hasher := sha256.New()
	hasher.Write([]byte(plainToken))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))

	query := `
		SELECT 
			1 
		FROM 
			mcp_tokens 
		WHERE 
			token_hash = ? AND is_active = 1
	`

	var exists int
	err := sqlite.DB.QueryRow(query, tokenHash).Scan(&exists)
	if err == sql.ErrNoRows {
		return false
	}
	if err != nil {
		slog.Error("error validating MCP token", "error", err)
		return false
	}

	return true
}
