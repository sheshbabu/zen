CREATE TABLE IF NOT EXISTS images (
    filename       TEXT PRIMARY KEY,
    width          INTEGER NOT NULL,
    height         INTEGER NOT NULL,
    format         TEXT NOT NULL,
    aspect_ratio   REAL NOT NULL,
    file_size      INTEGER NOT NULL,
    caption        TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS note_images (
    note_id      INTEGER NOT NULL,
    filename     TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, filename),
    FOREIGN KEY (note_id) REFERENCES notes (note_id),
    FOREIGN KEY (filename) REFERENCES images (filename)
);