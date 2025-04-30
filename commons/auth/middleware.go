package auth

import (
	"errors"
	"net/http"
	"zen/commons/session"
	"zen/features/users"
)

func EnsureAuthenticated(next http.Handler) http.HandlerFunc {
	mw := func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		hasUsers := users.HasUsers()

		// First user is admin
		if !hasUsers {
			next.ServeHTTP(w, r)
			return
		}

		if err != nil && errors.Is(err, http.ErrNoCookie) {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		if !session.IsValidSession(cookie.Value) {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		next.ServeHTTP(w, r)
	}

	return http.HandlerFunc(mw)
}
