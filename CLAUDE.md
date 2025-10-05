# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build Commands
- `make build` - Build production binary with frontend assets bundled
- `make dev` - Build and run development server with DEV_MODE=true
- `make watch` - Run development server with file watching (requires air and esbuild)

### Dependencies
For watch mode development, install:
```bash
go install github.com/air-verse/air@latest
go install github.com/evanw/esbuild/cmd/esbuild@latest
```

### Go Build Tags
All Go commands must include the `--tags "fts5"` flag for SQLite FTS5 support.

## Architecture Overview

### Backend (Go)
- **Entry Point**: `main.go` - Sets up HTTP server, routes, and background tasks
- **Database**: SQLite with FTS5 for full-text search, migrations in `./migrations/`
- **Feature-based Structure**: Each feature has its own directory under `features/`
  - `notes/` - Core note management (CRUD, archive, trash, pin/unpin)
  - `tags/` - Tag management and organization
  - `focus/` - Focus modes for filtered views
  - `search/` - Full-text search with BM25 ranking
  - `images/` - Image upload and management
  - `users/` - Authentication and user management
  - `settings/` - Import/export functionality
  - `templates/` - Template management with usage tracking and placeholders
  - `intelligence/` - AI-powered indexing and similarity search (optional, requires zen-intelligence)
  - `mcp/` - Model Context Protocol server for external integrations
- **Commons**: Shared utilities in `commons/`
  - `auth/` - Authentication middleware
  - `session/` - Session management
  - `sqlite/` - Database connection and migrations
  - `utils/` - HTTP utilities
  - `queue/` - Generic task queue for background processing
  - `preferences/` - User preferences (theme, view, search history)
  - `contexts/` - Preact context providers (AppContext, NotesContext)

### Frontend (Preact)
- **Entry Point**: `index.js` - Main app initialization and routing
- **Component Structure**: JSX components using Preact (React-like)
- **Build System**: esbuild bundles JSX to `assets/bundle.js`
- **Routing**: Custom router implementation in `commons/components/Router.jsx`
- **State Management**: Local component state and hooks
- **Styling**: Plain CSS with CSS custom properties for theming

### Key Patterns
- **API Routes**: RESTful endpoints prefixed with `/api/`
- **Authentication**: Session-based with middleware wrapping private routes
- **File Structure**: Features are self-contained with models, handlers, and components
- **Asset Handling**: Static assets embedded in binary for production, file system for development

### Database Schema
- Migrations are sequential SQL files in `./migrations/` with format `<version>_<title>.sql`
- Uses SQLite with FTS5 extension for full-text search
- Main entities: users, notes, tags, focus_modes, sessions, images, templates, mcp_tokens, queues

### Environment Variables
- `DEV_MODE=true` - Development mode with file system assets
- `PORT` - Server port (default: 8080)
- `IMAGES_FOLDER` - Image storage path (default: ./images)
- `INTELLIGENCE_ENABLED=true` - Enable optional AI features

### Background Tasks
- Trash cleanup (30 days)
- Session cleanup (24 hours)
- Image sync from disk (24 hours)
- Intelligence queue processing (5 minutes, requires zen-intelligence)

## Code Style Guidelines

### General
- Keep code simple and readable
- Use descriptive variable names and consistent formatting
- Avoid complex language features unless necessary
- Prefer standard libraries over external dependencies
- Don't add unnecessary comments

### Preact/React Components
- Extract logic from components into separate if-else conditions
- Extract map loops to variables outside JSX
- For conditional rendering, use if-else conditions outside JSX to build arrays/variables, not ternary operators or logical AND inside JSX
- Ternary operators in JSX are only acceptable for simple inline styles or class names
- Use `is` prefix for boolean props (`isActive`, `isLoading`)
- Use `has`, `can`, `should` prefixes for other boolean checks
- Refer to `index.css` for styling patterns

## Development Conventions

### Go Backend Patterns

#### Error Handling
- Use error wrapping with context: `fmt.Errorf("context: %w", err)`
- Always log errors with `slog.Error()` before returning
- Handle `sql.ErrNoRows` separately using `errors.Is()`
- Use `panic()` only for critical initialization errors

#### HTTP Handlers
- Function signature: `func HandleXXX(w http.ResponseWriter, r *http.Request)`
- Naming: `Handle{Action}{Resource}` (e.g., `HandleGetNotes`, `HandleCreateUser`)
- Structure: Parse/validate → Business logic → Response
- Use `utils.SendErrorResponse()` for consistent error responses
- Set `Content-Type: application/json` for JSON responses

#### Database Patterns
- Use global `sqlite.DB` instance from `commons/sqlite/db.go`
- Always use parameterized queries with `?` placeholders
- Defer `rows.Close()` for multi-row queries
- Use transactions for multi-step operations with defer rollback pattern
- Handle JSON data using SQLite JSON functions

#### API Endpoints
- RESTful patterns: `GET /api/resource/`, `POST /api/resource/`, `PUT /api/resource/{id}/`
- Private routes use `addPrivateRoute()` wrapper for authentication
- Response envelopes for paginated data (e.g., `ResponseEnvelope`)

#### Struct Conventions
- Separate database and API structs (e.g., `UserRecord` vs public struct)
- Use JSON tags for API responses: `json:"fieldName"`
- Naming: `{Resource}Record` for database structs, `{Resource}` for API

### Frontend Component Patterns

#### Component Structure
- Use function components with hooks
- Main exported function/component should always be the top function unless there are hoisting issues
- Early returns for conditional rendering
- Sub-components defined in same file after main component
- Default exports for components, named exports for utilities

#### State Management
- Use descriptive state names: `[notes, setNotes]`, `[isNotesLoading, setIsNotesLoading]`
- Local state with `useState`, prop drilling for shared state
- Functional updates for state dependent on previous state

#### API Calls
- Use centralized `ApiClient` from `commons/http/ApiClient.js`
- Use specific named methods (e.g., `ApiClient.createUser()`, `ApiClient.getTemplates()`, `ApiClient.getSimilarImages()`) rather than generic HTTP methods
- Promise chains with `.then()`, `.catch()`, `.finally()`
- Consistent error handling with toast notifications
- Skip toast for expected errors using `skipCodes` array

#### Function Declarations
- Use `function` keyword for event handlers, utility functions, and render functions
- Use arrow functions only for inline callbacks in JSX and when lexical `this` binding is needed
- Examples:
  ```javascript
  // Preferred: function declarations
  function handleSaveClick() { ... }
  function renderItems() { ... }
  
  // Acceptable: arrow functions for inline callbacks
  onClick={() => handleSaveClick()}
  items.map(item => ...)
  ```

#### Boolean Type Checking
- Use explicit boolean comparisons instead of truthy/falsy checks
- Examples:
  ```javascript
  // Preferred: explicit checks
  if (isEnabled === true) { ... }
  if (isEnabled !== true) { ... }
  if (typeof value === 'boolean' && value) { ... }
  
  // Avoid: truthy/falsy checks
  if (!isEnabled) { ... }
  if (isEnabled) { ... }
  ```

#### Event Handling
- Handler naming: `handle{Action}Click` (e.g., `handleSaveClick`)
- Keyboard shortcuts with `preventDefault()`
- Click outside patterns for modals using refs and event listeners

#### Modal Patterns
- Render to `.modal-root` using `render()` function
- Backdrop click handling with `classList.contains("modal-backdrop-container")`
- Consistent modal structure with header, content, and close button

#### CSS Classes
- BEM-like naming: `notes-editor-toolbar`, `left-toolbar`
- Use CSS nesting with `&` for modifiers and pseudo-elements: `&.visible`, `&:hover`, `&::before`
- Child classes and elements nested directly without `&`: `.child-class`, `svg.lucide`
- Conditional classes using template literals
- Minimal inline styles, prefer CSS classes
- Use semantic z-index layering system:
  - `z-index: 1` - Basic overlays (editor components, dropdown menus)
  - `z-index: 2` - Modal backdrops, mobile navbar, sidebar overlay
  - `z-index: 3` - Interactive content (toast notifications, sidebar content, tooltips)
  - `z-index: 4` - Critical notifications (offline indicator)