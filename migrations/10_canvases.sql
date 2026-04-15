CREATE TABLE canvases (
    canvas_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL DEFAULT 'Untitled Canvas',
    data        TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    preview     TEXT NOT NULL DEFAULT '{"nodes":[],"width":200,"height":150,"nodeCount":0}',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
