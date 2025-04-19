package main

import (
	"embed"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"zen/commons/sqlite"
	"zen/features/focus"
	"zen/features/images"
	"zen/features/notes"
	"zen/features/tags"
)

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

	mux.HandleFunc("GET /api/notes", notes.HandleGetNotes)
	mux.HandleFunc("GET /api/notes/{note_id}", notes.HandleGetNote)
	mux.HandleFunc("PUT /api/notes/{note_id}", notes.HandleUpdateNote)
	mux.HandleFunc("POST /api/notes/", notes.HandleCreateNote)

	mux.HandleFunc("GET /api/tags", tags.HandleGetTags)
	mux.HandleFunc("POST /api/tags", tags.HandleCreateTag)
	mux.HandleFunc("DELETE /api/tags/{tag_id}", tags.HandleDeleteTag)

	mux.HandleFunc("GET /api/focus/", focus.HandleGetAllFocusModesV2)

	mux.HandleFunc("POST /api/images/", images.HandleUploadImage)

	mux.HandleFunc("GET /assets/", handleStaticAssets)
	mux.HandleFunc("GET /images/", HandleUploadedImages)
	mux.HandleFunc("GET /", handleStaticAssets)

	return mux
}

func handleStaticAssets(w http.ResponseWriter, r *http.Request) {
	fs := http.FS(assets)

	if os.Getenv("DEV_MODE") == "true" {
		fs = http.Dir("./assets")
	}

	if strings.HasPrefix(r.URL.Path, "/assets/") {
		http.StripPrefix("/assets/", http.FileServer(fs)).ServeHTTP(w, r)
		return
	}

	http.StripPrefix("/", http.FileServer(fs)).ServeHTTP(w, r)
}

func HandleUploadedImages(w http.ResponseWriter, r *http.Request) {
	http.StripPrefix("/images/", http.FileServer(http.Dir("images"))).ServeHTTP(w, r)
}
