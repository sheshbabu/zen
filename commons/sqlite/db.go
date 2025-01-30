package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB = nil
var pragmas = "?_journal_mode=WAL&synchronous=normal&_foreign_keys=on"

func NewDB() error {
	path := getDataFolderPath()
	path = filepath.Join(path, "zen.db")

	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		slog.Info("sqlite file not found, creating new one at", "path", path)
		os.Create(path)
	}

	slog.Info("connecting to sqlite file at", "path", path)
	DB, err = sql.Open("sqlite3", "file:"+path+pragmas)
	if err != nil {
		err = fmt.Errorf("error connecting to SQLite file: %w", err)
		panic(err)
	}

	return nil
}

func getDataFolderPath() string {
	path := os.Getenv("DATA_FOLDER")

	if path == "" {
		path = "."
	}

	err := os.MkdirAll(path, os.ModePerm)

	if err != nil {
		err = fmt.Errorf("error creating directory at path: %w", err)
		panic(err)
	}

	return path
}
