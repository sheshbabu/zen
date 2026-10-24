package auth

import (
	"net/http"
	"strings"
	"zen/features/tokens"
)

// This is the single token validation path, shared with the MCP server.
func GetAccessFromBearer(r *http.Request) (Access, bool) {
	token, hasToken := getBearerToken(r)
	if !hasToken {
		return Access{}, false
	}

	scopes, isValid := tokens.ValidateAPIToken(token)
	if !isValid {
		return Access{}, false
	}

	return getAccessFromScopes(scopes), true
}

func getBearerToken(r *http.Request) (string, bool) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", false
	}

	return strings.TrimPrefix(authHeader, "Bearer "), true
}
