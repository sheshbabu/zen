CREATE TABLE IF NOT EXISTS focus_modes (
    focus_mode_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP DEFAULT NULL,
    last_used_at  TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS focus_mode_tags (
    focus_mode_id INTEGER NOT NULL,
    tag_id        INTEGER NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (focus_mode_id, tag_id),
    FOREIGN KEY (focus_mode_id) REFERENCES focus_modes (focus_mode_id),
    FOREIGN KEY (tag_id)        REFERENCES tags (tag_id)
);