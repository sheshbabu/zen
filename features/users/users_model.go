package users

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"zen/commons/sqlite"
)

func HasUsers() bool {
	query := "SELECT user_id FROM users LIMIT 1"
	var userID string

	row := sqlite.DB.QueryRow(query)
	err := row.Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		return false
	}
	if err != nil {
		err = fmt.Errorf("error retrieving users: %w", err)
		panic(err)
	}

	return true
}

func GetUserByEmail(email string) (UserRecord, error) {
	var user UserRecord

	query := "SELECT user_id, email, password_hash FROM users where email = ?"

	row := sqlite.DB.QueryRow(query, email)
	err := row.Scan(&user.UserID, &user.Email, &user.Password)
	if err != nil {
		err = fmt.Errorf("error retrieving user: %w", err)
		slog.Error(err.Error())
		return user, err
	}

	return user, nil
}

func GetUserByID(userID string) (UserRecord, error) {
	var user UserRecord

	query := "SELECT user_id, email, password_hash FROM users where user_id = ?"

	row := sqlite.DB.QueryRow(query, userID)
	err := row.Scan(&user.UserID, &user.Email, &user.Password)
	if err != nil {
		err = fmt.Errorf("error retrieving user: %w", err)
		slog.Error(err.Error())
		return user, err
	}

	return user, nil
}

func InsertUser(email string, passwordHash string, isAdmin bool) (UserRecord, error) {
	var user UserRecord

	query := "INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?) RETURNING user_id, email, password_hash"

	row := sqlite.DB.QueryRow(query, email, passwordHash, isAdmin)
	err := row.Scan(&user.UserID, &user.Email, &user.Password)

	if err != nil {
		err = fmt.Errorf("error inserting user: %w", err)
		slog.Error(err.Error())
		return user, err
	}

	return user, nil
}

func UpdatePassword(userID, passwordHash string) error {
	query := "UPDATE users SET password_hash = ? WHERE user_id = ?"

	_, err := sqlite.DB.Exec(query, passwordHash, userID)
	if err != nil {
		err = fmt.Errorf("error updating password: %w", err)
		slog.Error(err.Error())
		return err
	}

	return nil
}
