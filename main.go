package main

import (
	"embed"
	"log/slog"
	"net/http"
	"os"
	"zen/commons/sqlite"
	"zen/commons/templates"
	"zen/features/focus"
	"zen/features/images"
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

	path := os.Getenv("IMAGES_FOLDER")
	if path == "" {
		path = "./images"
	}
	if err := os.MkdirAll("images", 0755); err != nil {
		panic(err)
	}

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
	mux.HandleFunc("DELETE /tags/{tag_id}", tags.HandleDeleteTag)

	mux.HandleFunc("PUT /notes/{note_id}/tags", tags.HandleUpdateNoteTags)

	mux.HandleFunc("GET /images/", HandleUploadedImages)
	mux.HandleFunc("POST /images/", images.HandleUploadImage)

	mux.HandleFunc("GET /focus/{focus_id}", focus.HandleFocusDialog)
	// mux.HandleFunc("GET /focus/{focus_id}/tags", focus.HandleUpdateFocusTags)
	// mux.HandleFunc("PUT /focus/{focus_id}", focus.HandleUpdateFocus)
	// mux.HandleFunc("POST /focus/{focus_id}", focus.HandleCreateFocus)

	return mux
}

func handleStaticAssets(w http.ResponseWriter, r *http.Request) {
	http.FileServer(http.FS(assets)).ServeHTTP(w, r)
}

func HandleUploadedImages(w http.ResponseWriter, r *http.Request) {
	http.StripPrefix("/images/", http.FileServer(http.Dir("images"))).ServeHTTP(w, r)
}
