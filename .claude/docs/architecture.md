# Architecture

## Backend (Go)
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
  - `canvas/` - Spatial organization with infinite canvas
- **Commons**: Shared utilities in `commons/`
  - `auth/` - Authentication middleware and the request principal (session or API token)
  - `tokens/` - API tokens and their per-tag scopes
  - `session/` - Session management
  - `sqlite/` - Database connection and migrations
  - `utils/` - HTTP utilities
  - `queue/` - Generic task queue for background processing
  - `preferences/` - User preferences (theme, view, search history)
  - `contexts/` - Preact context providers (AppContext, NotesContext)

## Frontend (Preact)
- **Entry Point**: `index.js` - Main app initialization and routing
- **Component Structure**: JSX components using Preact (React-like)
- **Build System**: esbuild bundles JSX to `assets/bundle.js`
- **Routing**: Custom router implementation in `commons/components/Router.jsx`
- **State Management**: Local component state and hooks
- **Styling**: Plain CSS with CSS custom properties for theming

## Key Patterns
- **API Routes**: RESTful endpoints prefixed with `/api/v1/`
- **Authentication**: Session cookie for the app, or a bearer API token scoped to tags for scripts and MCP
- **File Structure**: Features are self-contained with models, handlers, and components
- **Asset Handling**: Static assets embedded in binary for production, file system for development

## Environment Variables
- `DEV_MODE=true` - Development mode with file system assets
- `PORT` - Server port (default: 8080)
- `IMAGES_FOLDER` - Image storage path (default: ./images)
- `INTELLIGENCE_ENABLED=true` - Enable optional AI features

## Background Tasks
- Trash cleanup (30 days)
- Session cleanup (24 hours)
- Image sync from disk (24 hours)
- Intelligence queue processing (5 minutes, requires zen-intelligence)
