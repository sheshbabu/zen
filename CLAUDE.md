# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Zen is a self-hosted notes app: Go backend with SQLite (FTS5), Preact frontend bundled by esbuild.

## Core rules (always apply)
- Keep code simple and readable; prefer the smallest change that solves the request
- Use descriptive variable names and consistent formatting
- Avoid complex language features unless necessary
- Prefer standard libraries over external dependencies
- Don't add unnecessary comments
- Don't modify unrelated files, dependencies, or CI unless asked
- All Go commands must include the `--tags "fts5"` flag for SQLite FTS5 support

## Build & run
- `make build` - Build production binary with frontend assets bundled
- `make dev` - Build and run development server with `DEV_MODE=true`
- `make watch` - Run development server with file watching
- `make test` - Run Go and JS unit tests (`go test` and `node --test`, no extra dependencies)

For watch mode, install:
```bash
go install github.com/air-verse/air@latest
go install github.com/evanw/esbuild/cmd/esbuild@latest
```

## Progressive disclosure — load only what you need
Do not read every documentation file at the start of a task.

- **Service boundaries, feature layout, routing, env vars, background tasks**
  → Read `.claude/docs/architecture.md`
- **Go handlers, errors, API endpoints, struct conventions**
  → Read `.claude/docs/backend.md`
- **SQLite schema, migrations, queries, transactions, FTS5**
  → Read `.claude/docs/database.md`
- **Preact components, state, hooks, API client, modals, event handling**
  → Read `.claude/docs/frontend.md`
- **CSS, design tokens, theming, class naming**
  → Read `.claude/docs/styling.md` (and `assets/index.css` for token values)
- **Infinite canvas, Konva.js, JSON Canvas nodes**
  → Read `.claude/docs/canvas.md`

If the task is a simple typo, rename, or small local fix, you usually need none of the above files.
