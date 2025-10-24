package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"zen/commons/auth"
	"zen/commons/session"
	"zen/commons/sqlite"
	"zen/features/focus"
	"zen/features/images"
	"zen/features/mcp"
	"zen/features/notes"
	"zen/features/search"
	"zen/features/settings"
	"zen/features/tags"
	"zen/features/templates"
	"zen/features/users"
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

	osSignalChan := make(chan os.Signal, 1)
	signal.Notify(osSignalChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-osSignalChan
		slog.Info("received shutdown signal, closing database connection...")
		if err := sqlite.DB.Close(); err != nil {
			slog.Error("error closing database", "error", err)
		}
		slog.Info("database connection closed. Exiting.")
		os.Exit(0)
	}()

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

	mux.HandleFunc("GET /api/users/me", auth.HandleCheckUser)
	mux.HandleFunc("POST /api/users/login", auth.HandleLogin)
	addPrivateRoute(mux, "POST /api/users/new", auth.HandleCreateUser)
	addPrivateRoute(mux, "POST /api/users/me/password", users.HandleUpdatePassword)
	addPrivateRoute(mux, "POST /api/users/logout", auth.HandleLogout)

	addPrivateRoute(mux, "GET /api/notes/", notes.HandleGetNotes)
	addPrivateRoute(mux, "GET /api/notes/{noteId}/", notes.HandleGetNote)
	addPrivateRoute(mux, "PUT /api/notes/{noteId}/", notes.HandleUpdateNote)
	addPrivateRoute(mux, "POST /api/notes/", notes.HandleCreateNote)
	addPrivateRoute(mux, "DELETE /api/notes/{noteId}/", notes.HandleSoftDeleteNote)
	addPrivateRoute(mux, "PUT /api/notes/{noteId}/restore/", notes.HandleRestoreDeletedNote)
	addPrivateRoute(mux, "PUT /api/notes/{noteId}/archive/", notes.HandleArchiveNote)
	addPrivateRoute(mux, "PUT /api/notes/{noteId}/unarchive/", notes.HandleUnarchiveNote)
	addPrivateRoute(mux, "PUT /api/notes/{noteId}/pin/", notes.HandlePinNote)
	addPrivateRoute(mux, "PUT /api/notes/{noteId}/unpin/", notes.HandleUnpinNote)

	addPrivateRoute(mux, "GET /api/tags/", tags.HandleGetTags)
	addPrivateRoute(mux, "PUT /api/tags/", tags.HandleUpdateTag)
	addPrivateRoute(mux, "DELETE /api/tags/{tagId}/", tags.HandleDeleteTag)

	addPrivateRoute(mux, "GET /api/focus/", focus.HandleGetAllFocusModes)
	addPrivateRoute(mux, "POST /api/focus/", focus.HandleCreateFocusMode)
	addPrivateRoute(mux, "PUT /api/focus/{focusId}/", focus.HandleUpdateFocusMode)

	addPrivateRoute(mux, "POST /api/images/", images.HandleUploadImage)
	addPrivateRoute(mux, "GET /api/images/", images.HandleGetImages)

	addPrivateRoute(mux, "POST /api/import/", settings.HandleImport)
	addPrivateRoute(mux, "GET /api/export/", settings.HandleExport)

	addPrivateRoute(mux, "GET /api/mcp/tokens/", mcp.HandleGetMCPTokens)
	addPrivateRoute(mux, "POST /api/mcp/tokens/", mcp.HandleCreateMCPToken)
	addPrivateRoute(mux, "DELETE /api/mcp/tokens/{tokenId}/", mcp.HandleRevokeMCPToken)

	addPrivateRoute(mux, "GET /api/search/", search.HandleSearch)

	addPrivateRoute(mux, "GET /api/templates/", templates.HandleGetTemplates)
	addPrivateRoute(mux, "GET /api/templates/{templateId}/", templates.HandleGetTemplate)
	addPrivateRoute(mux, "POST /api/templates/", templates.HandleCreateTemplate)
	addPrivateRoute(mux, "PUT /api/templates/{templateId}/", templates.HandleUpdateTemplate)
	addPrivateRoute(mux, "DELETE /api/templates/{templateId}/", templates.HandleDeleteTemplate)
	addPrivateRoute(mux, "GET /api/templates/recommended/", templates.HandleGetRecommendedTemplates)
	addPrivateRoute(mux, "PUT /api/templates/{templateId}/usage/", templates.HandleIncrementTemplateUsage)

	mux.HandleFunc("POST /mcp", mcp.HandleMCP)
	mux.HandleFunc("OPTIONS /mcp", mcp.HandleMCP)

	mux.HandleFunc("GET /assets/", handleStaticAssets)
	mux.HandleFunc("GET /images/", handleUploadedImages)
	mux.HandleFunc("GET /sw.js", handleServiceWorker)
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
	w.Header().Set("Cache-Control", "public, max-age=31536000") // 1 year
	http.StripPrefix("/images/", http.FileServer(http.Dir("images"))).ServeHTTP(w, r)
}

func addPrivateRoute(mux *http.ServeMux, pattern string, handlerFunc func(w http.ResponseWriter, r *http.Request)) {
	handler := http.HandlerFunc(handlerFunc)
	mux.HandleFunc(pattern, auth.EnsureAuthenticated(handler))
}

func runBackgroundTasks() {
	trashCleanupFrequency := 30 * 24 * time.Hour // 30 days
	sessionCleanupFrequency := 24 * time.Hour    // 24 hours
	imageSyncFrequency := 24 * time.Hour         // 24 hours

	go func() {
		for range time.Tick(trashCleanupFrequency) {
			notes.EmptyTrash()
		}
	}()

	go func() {
		for range time.Tick(sessionCleanupFrequency) {
			session.DeleteExpiredSessions()
		}
	}()

	go func() {
		for range time.Tick(imageSyncFrequency) {
			images.SyncImagesFromDisk()
		}
	}()
}

func handleServiceWorker(w http.ResponseWriter, r *http.Request) {
	var swContent []byte
	var err error

	swContent, err = os.ReadFile("./assets/sw.js")
	if err != nil {
		err = fmt.Errorf("error reading sw.js: %w", err)
		slog.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Service-Worker-Allowed", "/")
	w.WriteHeader(http.StatusOK)
	w.Write(swContent)
}
