# Database Guidelines

## Stack
- SQLite with the FTS5 extension for full-text search
- Global `sqlite.DB` instance from `commons/sqlite/db.go`
- All Go commands must include `--tags "fts5"`

## Schema & Migrations
- Migrations are sequential SQL files in `./migrations/` with format `<version>_<title>.sql`
- Main entities: users, notes, tags, focus_modes, sessions, images, templates, api_tokens, api_token_scopes, queues, canvases

## Query Patterns
- Always use parameterized queries with `?` placeholders
- Defer `rows.Close()` for multi-row queries
- Use transactions for multi-step operations with defer rollback pattern
- Handle JSON data using SQLite JSON functions
- Handle `sql.ErrNoRows` separately using `errors.Is()`
