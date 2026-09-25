# Go Backend Guidelines

All Go commands must include the `--tags "fts5"` flag for SQLite FTS5 support.

## Error Handling
- Use error wrapping with context: `fmt.Errorf("context: %w", err)`
- Always log errors with `slog.Error()` before returning
- Handle `sql.ErrNoRows` separately using `errors.Is()`
- Use `panic()` only for critical initialization errors

## HTTP Handlers
- Function signature: `func HandleXXX(w http.ResponseWriter, r *http.Request)`
- Naming: `Handle{Action}{Resource}` (e.g., `HandleGetNotes`, `HandleCreateUser`)
- Structure: Parse/validate → Business logic → Response
- Use `utils.SendErrorResponse()` for consistent error responses
- Set `Content-Type: application/json` for JSON responses

## API Endpoints
- RESTful patterns: `GET /api/v1/resource/`, `POST /api/v1/resource/`, `PUT /api/v1/resource/{id}/`
- Routes are registered in `main.go` with one of three wrappers:
  - `addPublicRoute()` - no authentication
  - `addSessionRoute()` - logged-in users only; API tokens get 403
  - `addAuthenticatedRoute()` - logged-in users or API tokens
- Handlers on authenticated routes pass `auth.GetAccess(r.Context())` to the model, and never branch on the caller. Model functions reachable by tokens take an `auth.Access` and apply it in SQL (`buildReadableNotesPredicate` in the notes model, `tags.BuildReadableTagsPredicate`) or before writing (`auth.CanWrite`, returning `auth.ErrForbidden`). Sessions and background work use `auth.Unrestricted`
- Response envelopes for paginated data (e.g., `ResponseEnvelope`)

## Struct Conventions
- Separate database and API structs (e.g., `UserRecord` vs public struct)
- Use JSON tags for API responses: `json:"fieldName"`
- Naming: `{Resource}Record` for database structs, `{Resource}` for API
