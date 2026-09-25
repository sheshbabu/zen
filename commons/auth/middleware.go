package auth

import (
	"net/http"
	"zen/commons/session"
	"zen/commons/utils"
	"zen/features/users"
)

func EnsureAuthenticated(next http.Handler) http.HandlerFunc {
	mw := func(w http.ResponseWriter, r *http.Request) {
		if hasSessionAccess(r) {
			next.ServeHTTP(w, r.WithContext(SetAccess(r.Context(), Unrestricted)))
			return
		}

		// Bearer presence, not validity, selects the token path
		// An agent must never be answered with a redirect to the login page
		if _, hasToken := getBearerToken(r); hasToken {
			access, isValid := GetAccessFromBearer(r)
			if !isValid {
				utils.SendErrorResponse(w, "INVALID_TOKEN", "Invalid or expired token.", nil, http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r.WithContext(SetAccess(r.Context(), access)))
			return
		}

		http.Redirect(w, r, "/login", http.StatusSeeOther)
	}

	return http.HandlerFunc(mw)
}

// Tokens are rejected on routes that no scope can express.
func EnsureSession(next http.Handler) http.HandlerFunc {
	mw := func(w http.ResponseWriter, r *http.Request) {
		if hasSessionAccess(r) {
			next.ServeHTTP(w, r.WithContext(SetAccess(r.Context(), Unrestricted)))
			return
		}

		if _, hasToken := getBearerToken(r); hasToken {
			utils.SendErrorResponse(w, "SESSION_REQUIRED", "This endpoint requires an interactive session.", nil, http.StatusForbidden)
			return
		}

		http.Redirect(w, r, "/login", http.StatusSeeOther)
	}

	return http.HandlerFunc(mw)
}

func HasValidSession(r *http.Request) bool {
	cookie, err := r.Cookie("session_token")
	return err == nil && session.IsValidSession(cookie.Value)
}

// First user is admin
func hasSessionAccess(r *http.Request) bool {
	return HasValidSession(r) || !users.HasUsers()
}
