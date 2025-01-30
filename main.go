package main

import (
	"embed"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"zen/commons/sqlite"
	"zen/commons/templates"
	"zen/features/notes"
	"zen/features/tags"
)

//go:embed all:commons all:features
var resources embed.FS

//go:embed assets/*
var assets embed.FS

//go:embed migrations/*.sql
var migrations embed.FS

func main() {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("killing server", "error", r)
			os.Exit(1)
		}
	}()

	sqlite.NewDB()
	defer sqlite.DB.Close()

	sqlite.Migrate(migrations)

	templates.NewTemplates(resources)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	port = ":" + port

	slog.Info("starting server", "port", port)
	err := http.ListenAndServe(port, newRouter())
	if err != nil {
		panic(err)
	}
}

func newRouter() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /assets/", handleStaticAssets)

	mux.HandleFunc("GET /", notes.HandleNotesPage)
	mux.HandleFunc("GET /notes/", notes.HandleNotesPage)
	mux.HandleFunc("GET /notes/{note_id}", notes.HandleNotesPage)

	mux.HandleFunc("PUT /notes/{note_id}", notes.HandleUpdateNote)
	mux.HandleFunc("POST /notes/", notes.HandleCreateNote)

	mux.HandleFunc("GET /tags/", tags.HandleTags)
	mux.HandleFunc("POST /tags/", tags.HandleCreateTag)

	mux.HandleFunc("PUT /notes/{note_id}/tags", tags.HandleUpdateNoteTags)

	return mux
}

func handleStaticAssets(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/assets") {
		w.Header().Set("Cache-Control", "public, max-age=31536000") // 1 year
	}

	http.FileServer(http.FS(assets)).ServeHTTP(w, r)
}
