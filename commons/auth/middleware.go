package auth

import (
	"net/http"
	"zen/features/users"
)

func EnsureAuthenticated(next http.Handler) http.HandlerFunc {
	mw := func(w http.ResponseWriter, r *http.Request) {
		hasUsers := users.HasUsers()

		// First user is admin
		if !hasUsers {
			next.ServeHTTP(w, r)
			return
		}

		err := ValidateSession(r)
		if err != nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		next.ServeHTTP(w, r)
	}

	return http.HandlerFunc(mw)
}
