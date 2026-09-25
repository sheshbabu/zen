package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
	"zen/commons/auth"
	"zen/commons/session"
	"zen/commons/sqlite"
	"zen/features/canvas"
	"zen/features/focus"
	"zen/features/images"
	"zen/features/intelligence"
	"zen/features/mcp"
	"zen/features/notes"
	"zen/features/search"
	"zen/features/settings"
	"zen/features/tags"
	"zen/features/templates"
	"zen/features/tokens"
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

	addPublicRoute(mux, "GET /api/v1/users/me", users.HandleCheckUser)
	addPublicRoute(mux, "POST /api/v1/users/login", users.HandleLogin)
	addSessionRoute(mux, "POST /api/v1/users/new", users.HandleCreateUser)
	addSessionRoute(mux, "POST /api/v1/users/me/password", users.HandleUpdatePassword)
	addSessionRoute(mux, "POST /api/v1/users/logout", users.HandleLogout)

	addAuthenticatedRoute(mux, "GET /api/v1/notes/", notes.HandleGetNotes)
	addAuthenticatedRoute(mux, "GET /api/v1/notes/{noteId}/", notes.HandleGetNote)
	addSessionRoute(mux, "GET /api/v1/notes/{noteId}/related/", notes.HandleGetRelatedNotes)
	addAuthenticatedRoute(mux, "POST /api/v1/notes/", notes.HandleCreateNote)
	addAuthenticatedRoute(mux, "PUT /api/v1/notes/{noteId}/", notes.HandleUpdateNote)
	addSessionRoute(mux, "DELETE /api/v1/notes/bulk/", notes.HandleBulkSoftDeleteNotes)
	addSessionRoute(mux, "DELETE /api/v1/notes/{noteId}/", notes.HandleSoftDeleteNote)
	addSessionRoute(mux, "DELETE /api/v1/notes/", notes.HandleDeleteNotes)
	addSessionRoute(mux, "PUT /api/v1/notes/bulk/archive/", notes.HandleBulkArchiveNotes)
	addSessionRoute(mux, "PUT /api/v1/notes/{noteId}/archive/", notes.HandleArchiveNote)
	addSessionRoute(mux, "PUT /api/v1/notes/{noteId}/unarchive/", notes.HandleUnarchiveNote)
	addSessionRoute(mux, "PUT /api/v1/notes/{noteId}/restore/", notes.HandleRestoreDeletedNote)
	addSessionRoute(mux, "PUT /api/v1/notes/{noteId}/pin/", notes.HandlePinNote)
	addSessionRoute(mux, "PUT /api/v1/notes/{noteId}/unpin/", notes.HandleUnpinNote)
	addSessionRoute(mux, "GET /api/v1/notes/{noteId}/versions/", notes.HandleGetNoteVersions)
	addSessionRoute(mux, "PUT /api/v1/notes/{noteId}/versions/{versionId}/restore/", notes.HandleRestoreNoteVersion)

	addAuthenticatedRoute(mux, "GET /api/v1/tags/", tags.HandleGetTags)
	addSessionRoute(mux, "PUT /api/v1/tags/", tags.HandleUpdateTag)
	addSessionRoute(mux, "DELETE /api/v1/tags/{tagId}/", tags.HandleDeleteTag)

	addSessionRoute(mux, "GET /api/v1/focus/", focus.HandleGetAllFocusModes)
	addSessionRoute(mux, "POST /api/v1/focus/", focus.HandleCreateFocusMode)
	addSessionRoute(mux, "PUT /api/v1/focus/{focusId}/", focus.HandleUpdateFocusMode)
	addSessionRoute(mux, "DELETE /api/v1/focus/{focusId}/", focus.HandleDeleteFocusMode)

	addSessionRoute(mux, "POST /api/v1/images/", images.HandleUploadImage)
	addSessionRoute(mux, "GET /api/v1/images/", images.HandleGetImages)

	addSessionRoute(mux, "POST /api/v1/import/", settings.HandleImport)
	addSessionRoute(mux, "GET /api/v1/export/", settings.HandleExport)

	addSessionRoute(mux, "GET /api/v1/tokens/", tokens.HandleGetAPITokens)
	addSessionRoute(mux, "POST /api/v1/tokens/", tokens.HandleCreateAPIToken)
	addSessionRoute(mux, "DELETE /api/v1/tokens/{tokenId}/", tokens.HandleRevokeAPIToken)

	addAuthenticatedRoute(mux, "GET /api/v1/search/", search.HandleSearch)

	addSessionRoute(mux, "GET /api/v1/intelligence/availability/", intelligence.HandleAvailability)
	addSessionRoute(mux, "POST /api/v1/intelligence/index/", intelligence.HandleIndexAllContent)
	addSessionRoute(mux, "GET /api/v1/intelligence/queue/", intelligence.HandleQueueStats)
	addSessionRoute(mux, "GET /api/v1/intelligence/similarity/images/{filename}/", intelligence.HandleSimilarImages)

	addSessionRoute(mux, "GET /api/v1/templates/", templates.HandleGetTemplates)
	addSessionRoute(mux, "GET /api/v1/templates/{templateId}/", templates.HandleGetTemplate)
	addSessionRoute(mux, "POST /api/v1/templates/", templates.HandleCreateTemplate)
	addSessionRoute(mux, "PUT /api/v1/templates/{templateId}/", templates.HandleUpdateTemplate)
	addSessionRoute(mux, "DELETE /api/v1/templates/{templateId}/", templates.HandleDeleteTemplate)
	addSessionRoute(mux, "GET /api/v1/templates/recommended/", templates.HandleGetRecommendedTemplates)
	addSessionRoute(mux, "PUT /api/v1/templates/{templateId}/usage/", templates.HandleIncrementTemplateUsage)

	addSessionRoute(mux, "GET /api/v1/canvases/", canvas.HandleGetCanvases)
	addSessionRoute(mux, "GET /api/v1/canvases/{canvasId}/", canvas.HandleGetCanvas)
	addSessionRoute(mux, "POST /api/v1/canvases/", canvas.HandleCreateCanvas)
	addSessionRoute(mux, "PUT /api/v1/canvases/{canvasId}/", canvas.HandleUpdateCanvas)
	addSessionRoute(mux, "DELETE /api/v1/canvases/{canvasId}/", canvas.HandleDeleteCanvas)

	mux.HandleFunc("POST /mcp", mcp.HandleMCP)
	mux.HandleFunc("OPTIONS /mcp", mcp.HandleMCP)

	// Bundles cached by the service worker before the move to /api/v1/ still call /api/ on the first page load after an upgrade.
	// Token clients never had the unversioned paths, so they are not forwarded.
	for _, method := range []string{"GET", "POST", "PUT", "DELETE"} {
		mux.HandleFunc(method+" /api/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/v1/") || (r.Header.Get("Authorization") != "" && !auth.HasValidSession(r)) {
				http.NotFound(w, r)
				return
			}

			legacyRequest := r.Clone(r.Context())
			legacyRequest.URL.Path = "/api/v1/" + strings.TrimPrefix(r.URL.Path, "/api/")
			legacyRequest.URL.RawPath = ""
			mux.ServeHTTP(w, legacyRequest)
		})
	}

	addPublicRoute(mux, "GET /assets/", handleStaticAssets)
	addPublicRoute(mux, "GET /images/", handleUploadedImages)
	addPublicRoute(mux, "GET /sw.js", handleServiceWorker)
	addPublicRoute(mux, "GET /", handleRoot)

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

func addPublicRoute(mux *http.ServeMux, pattern string, handlerFunc func(w http.ResponseWriter, r *http.Request)) {
	mux.HandleFunc(pattern, handlerFunc)
}

func addAuthenticatedRoute(mux *http.ServeMux, pattern string, handlerFunc func(w http.ResponseWriter, r *http.Request)) {
	handler := http.HandlerFunc(handlerFunc)
	mux.HandleFunc(pattern, auth.EnsureAuthenticated(handler))
}

func addSessionRoute(mux *http.ServeMux, pattern string, handlerFunc func(w http.ResponseWriter, r *http.Request)) {
	handler := http.HandlerFunc(handlerFunc)
	mux.HandleFunc(pattern, auth.EnsureSession(handler))
}

func runBackgroundTasks() {
	trashCleanupFrequency := 30 * 24 * time.Hour       // 30 days
	sessionCleanupFrequency := 24 * time.Hour          // 24 hours
	imageSyncFrequency := 24 * time.Hour               // 24 hours
	intelligenceProcessingFrequency := 5 * time.Minute // 5 minutes
	versionPruneFrequency := 24 * time.Hour            // 24 hours

	go func() {
		notes.EmptyTrash(true) // Run immediately on server start
		for range time.Tick(trashCleanupFrequency) {
			notes.EmptyTrash(true)
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

	go func() {
		for range time.Tick(intelligenceProcessingFrequency) {
			intelligence.ProcessQueues()
		}
	}()

	go func() {
		notes.PruneNoteVersions() // Run immediately on server start
		for range time.Tick(versionPruneFrequency) {
			notes.PruneNoteVersions()
		}
	}()
}

func handleServiceWorker(w http.ResponseWriter, r *http.Request) {
	var swContent []byte
	var err error

	if os.Getenv("DEV_MODE") == "true" {
		swContent, err = os.ReadFile("./assets/sw.js")
	} else {
		swContent, err = assets.ReadFile("assets/sw.js")
	}

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
