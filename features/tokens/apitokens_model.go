package tokens

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

// AllTags is the tag_id sentinel for a scope covering every tag.
const AllTags = 0

type Scope struct {
	TagID    int  `json:"tagId"`
	CanRead  bool `json:"canRead"`
	CanWrite bool `json:"canWrite"`
}

type APIToken struct {
	TokenID   int       `json:"tokenId"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	Scopes    []Scope   `json:"scopes"`
}

func GetAllAPITokens() ([]APIToken, error) {
	apiTokens := []APIToken{}

	query := `
		SELECT
			t.token_id,
			t.name,
			t.created_at,
			s.tag_id,
			s.can_read,
			s.can_write
		FROM
			api_tokens t
		LEFT JOIN
			api_token_scopes s ON s.token_id = t.token_id
		ORDER BY
			t.created_at DESC, s.tag_id ASC
	`

	rows, err := sqlite.DB.Query(query)
	if err != nil {
		err = fmt.Errorf("error retrieving API tokens: %w", err)
		slog.Error(err.Error())
		return apiTokens, err
	}
	defer rows.Close()

	indexByTokenID := map[int]int{}

	for rows.Next() {
		var tokenID int
		var name string
		var createdAt time.Time
		var tagID sql.NullInt64
		var canRead, canWrite sql.NullBool

		err = rows.Scan(&tokenID, &name, &createdAt, &tagID, &canRead, &canWrite)
		if err != nil {
			err = fmt.Errorf("error scanning API token: %w", err)
			slog.Error(err.Error())
			return apiTokens, err
		}

		index, exists := indexByTokenID[tokenID]
		if !exists {
			token := APIToken{
				TokenID:   tokenID,
				Name:      name,
				CreatedAt: createdAt,
				Scopes:    []Scope{},
			}
			apiTokens = append(apiTokens, token)
			index = len(apiTokens) - 1
			indexByTokenID[tokenID] = index
		}

		if tagID.Valid {
			apiTokens[index].Scopes = append(apiTokens[index].Scopes, Scope{
				TagID:    int(tagID.Int64),
				CanRead:  canRead.Bool,
				CanWrite: canWrite.Bool,
			})
		}
	}

	return apiTokens, nil
}

func CreateAPIToken(name string, scopes []Scope) (string, APIToken, error) {
	// Generate a secure random token
	tokenBytes := make([]byte, 24) // 32 characters when hex encoded
	_, err := rand.Read(tokenBytes)
	if err != nil {
		err = fmt.Errorf("error generating token: %w", err)
		slog.Error(err.Error())
		return "", APIToken{}, err
	}

	plainToken := hex.EncodeToString(tokenBytes)
	tokenHash := hashToken(plainToken)

	tx, err := sqlite.DB.Begin()
	if err != nil {
		err = fmt.Errorf("error beginning transaction: %w", err)
		slog.Error(err.Error())
		return "", APIToken{}, err
	}
	defer tx.Rollback()

	var token APIToken
	query := `
		INSERT INTO
			api_tokens (name, token_hash)
		VALUES
			(?, ?)
		RETURNING
			token_id, name, created_at
	`

	row := tx.QueryRow(query, name, tokenHash)
	err = row.Scan(&token.TokenID, &token.Name, &token.CreatedAt)
	if err != nil {
		err = fmt.Errorf("error creating API token: %w", err)
		slog.Error(err.Error())
		return "", APIToken{}, err
	}

	scopeQuery := `
		INSERT INTO
			api_token_scopes (token_id, tag_id, can_read, can_write)
		VALUES
			(?, ?, ?, ?)
	`

	for _, scope := range scopes {
		_, err = tx.Exec(scopeQuery, token.TokenID, scope.TagID, scope.CanRead, scope.CanWrite)
		if err != nil {
			err = fmt.Errorf("error creating API token scope: %w", err)
			slog.Error(err.Error())
			return "", APIToken{}, err
		}
	}
	token.Scopes = scopes

	err = tx.Commit()
	if err != nil {
		err = fmt.Errorf("error committing API token: %w", err)
		slog.Error(err.Error())
		return "", APIToken{}, err
	}

	return plainToken, token, nil
}

func RevokeAPIToken(tokenID int) error {
	query := `
		DELETE FROM
			api_tokens
		WHERE
			token_id = ?
	`

	result, err := sqlite.DB.Exec(query, tokenID)
	if err != nil {
		err = fmt.Errorf("error revoking API token: %w", err)
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
		err = fmt.Errorf("API token not found")
		slog.Error(err.Error())
		return err
	}

	return nil
}

// A token that exists but carries no scope rows is valid and powerless.
func ValidateAPIToken(plainToken string) ([]Scope, bool) {
	if plainToken == "" {
		return nil, false
	}

	tokenHash := hashToken(plainToken)

	query := `
		SELECT
			t.token_id,
			s.tag_id,
			s.can_read,
			s.can_write
		FROM
			api_tokens t
		LEFT JOIN
			api_token_scopes s ON s.token_id = t.token_id
		WHERE
			t.token_hash = ?
	`

	rows, err := sqlite.DB.Query(query, tokenHash)
	if err != nil {
		slog.Error("error validating API token", "error", err)
		return nil, false
	}
	defer rows.Close()

	tokenID := 0
	scopes := []Scope{}

	for rows.Next() {
		var tagID sql.NullInt64
		var canRead, canWrite sql.NullBool

		err = rows.Scan(&tokenID, &tagID, &canRead, &canWrite)
		if err != nil {
			slog.Error("error scanning API token scope", "error", err)
			return nil, false
		}

		if tagID.Valid {
			scopes = append(scopes, Scope{
				TagID:    int(tagID.Int64),
				CanRead:  canRead.Bool,
				CanWrite: canWrite.Bool,
			})
		}
	}

	if tokenID == 0 {
		return nil, false
	}

	return scopes, true
}

func HasTag(tagID int) (bool, error) {
	query := `
		SELECT
			1
		FROM
			tags
		WHERE
			tag_id = ? AND deleted_at IS NULL
	`

	var exists int
	err := sqlite.DB.QueryRow(query, tagID).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		err = fmt.Errorf("error checking tag: %w", err)
		slog.Error(err.Error())
		return false, err
	}

	return true, nil
}

func hashToken(plainToken string) string {
	hash := sha256.Sum256([]byte(plainToken))
	return hex.EncodeToString(hash[:])
}
