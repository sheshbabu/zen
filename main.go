package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"time"
	"zen/commons/sqlite"
	"zen/features/focus"
	"zen/features/images"
	"zen/features/notes"
	"zen/features/search"
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

	go runBackgroundTasks()

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

	mux.HandleFunc("GET /api/notes/", notes.HandleGetNotes)
	mux.HandleFunc("GET /api/notes/{noteId}/", notes.HandleGetNote)
	mux.HandleFunc("PUT /api/notes/{noteId}/", notes.HandleUpdateNote)
	mux.HandleFunc("POST /api/notes/", notes.HandleCreateNote)
	mux.HandleFunc("DELETE /api/notes/{noteId}/", notes.HandleSoftDeleteNote)
	mux.HandleFunc("PUT /api/notes/{noteId}/restore/", notes.HandleRestoreDeletedNote)
	mux.HandleFunc("PUT /api/notes/{noteId}/archive/", notes.HandleArchiveNote)
	mux.HandleFunc("PUT /api/notes/{noteId}/unarchive/", notes.HandleUnarchiveNote)

	mux.HandleFunc("GET /api/tags/", tags.HandleGetTags)
	mux.HandleFunc("PUT /api/tags/", tags.HandleUpdateTag)
	mux.HandleFunc("DELETE /api/tags/{tagId}/", tags.HandleDeleteTag)

	mux.HandleFunc("GET /api/focus/", focus.HandleGetAllFocusModes)
	mux.HandleFunc("POST /api/focus/", focus.HandleCreateFocusMode)
	mux.HandleFunc("PUT /api/focus/{focusId}/", focus.HandleUpdateFocusMode)

	mux.HandleFunc("POST /api/images/", images.HandleUploadImage)

	mux.HandleFunc(("GET /api/search/"), search.HandleSearch)

	mux.HandleFunc("GET /assets/", handleStaticAssets)
	mux.HandleFunc("GET /images/", handleUploadedImages)
	mux.HandleFunc("GET /", handleRoot)

	return mux
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	var indexPage []byte
	var err error

	if os.Getenv("DEV_MODE") == "true" {
		indexPage, err = os.ReadFile("./assets/index.html")
	} else {
		indexPage, err = assets.ReadFile("assets/index.html")
	}

	if err != nil {
		err = fmt.Errorf("error reading index.html: %w", err)
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(indexPage)
}

func handleStaticAssets(w http.ResponseWriter, r *http.Request) {
	var fsys http.FileSystem

	if os.Getenv("DEV_MODE") == "true" {
		fsys = http.Dir("./assets")
	} else {
		subtree, err := fs.Sub(assets, "assets")
		if err != nil {
			err = fmt.Errorf("error reading assets subtree: %w", err)
			slog.Error(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		fsys = http.FS(subtree)
	}

	http.StripPrefix("/assets/", http.FileServer(fsys)).ServeHTTP(w, r)
}

func handleUploadedImages(w http.ResponseWriter, r *http.Request) {
	http.StripPrefix("/images/", http.FileServer(http.Dir("images"))).ServeHTTP(w, r)
}

func runBackgroundTasks() {
	frequency := 30 * 24 * time.Hour // 30 days
	for range time.Tick(frequency) {
		notes.EmptyTrash()
	}
}
