# Canvas Guidelines

Spatial organization feature with an infinite canvas, in `features/canvas/`.

## Stack
- **Canvas Library**: Konva.js for 2D canvas rendering (`assets/konva.min.js`)
- **File Format**: JSON Canvas (jsoncanvas.org) for data storage
- **Storage**: Database-backed persistence (`canvases` table)

## Model
- **Node Types**: Note nodes, sticky notes, image nodes
- **Features**: Pan/zoom viewport, selection, transformation, spatial organization, multiple named canvases

Canvas components follow the same Preact and styling conventions as the rest of the
app — see `.claude/docs/frontend.md` and `.claude/docs/styling.md`.
