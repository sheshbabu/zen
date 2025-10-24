package auth

import (
	"net/mail"
)

// IsValidEmail checks if the provided email address is valid
func IsValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

// IsValidPassword checks if the provided password meets minimum requirements
func IsValidPassword(password string) bool {
	return len(password) >= 8
}
