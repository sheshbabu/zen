# Go Backend Guidelines

All Go commands must include the `--tags "fts5"` flag for SQLite FTS5 support.

## Error Handling
- Use error wrapping with context: `fmt.Errorf("context: %w", err)`
- Don't log errors you return. Log once where an error stops propagating: `SendErrorResponse` logs for handlers, and background loops, best-effort calls (e.g. queueing) and swallowed errors log with `slog.Error()`
- Handle `sql.ErrNoRows` separately using `errors.Is()`
- Models return `utils.ErrNotFound` (wrapped with `%w`) when a lookup finds no row or an update/delete affects zero rows. Handlers pass 500 to `SendErrorResponse`, which sends 404 for `ErrNotFound`
- Use `panic()` only for critical initialization errors

## HTTP Handlers
- Function signature: `func HandleXXX(w http.ResponseWriter, r *http.Request)`
- Naming: `Handle{Action}{Resource}` (e.g., `HandleGetNotes`, `HandleCreateUser`)
- Structure: Parse/validate → Business logic → Response
- Use `utils.SendErrorResponse()` for consistent error responses
- Send JSON with `utils.SendJSON(w, status, value)`, never `json.NewEncoder(w)` directly

## API Endpoints
- RESTful patterns: `GET /api/v1/resource/`, `POST /api/v1/resource/`, `PUT /api/v1/resource/{id}/`
- Routes are registered in `main.go` with one of three wrappers:
  - `addPublicRoute()` - no authentication
  - `addSessionRoute()` - logged-in users only; API tokens get 403
  - `addAuthenticatedRoute()` - logged-in users or API tokens
- Handlers on authenticated routes pass `auth.GetAccess(r.Context())` to the model, and never branch on the caller. Model functions reachable by tokens take an `auth.Access` and apply it in SQL (`buildReadableNotesPredicate` in the notes model, `tags.BuildReadableTagsPredicate`) or before writing (`auth.CanWrite`, returning `auth.ErrForbidden`). Sessions and background work use `auth.Unrestricted`
- Response envelopes for paginated data (e.g., `ResponseEnvelope`)
- Exceptions: static assets in `main.go` use `http.Error`, and `/mcp` is registered with `mux.HandleFunc` because MCP does its own bearer auth

## Struct Conventions
- Use one struct for DB and API unless their shapes differ; then name the DB struct `{Resource}Record` (e.g., `UserRecord`, which holds the password hash)
- Request bodies that aren't a resource are `{Action}Request` (e.g., `LoginRequest`)
- Use camelCase JSON tags: `json:"fieldName"`
