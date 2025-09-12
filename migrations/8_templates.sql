CREATE TABLE templates (
    template_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    title        TEXT DEFAULT '',
    content      TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usage_count  INTEGER DEFAULT 0,
    last_used_at TIMESTAMP DEFAULT NULL
);

CREATE TABLE template_tags (
    template_id INTEGER NOT NULL,
    tag_id      INTEGER NOT NULL,
    PRIMARY KEY (template_id, tag_id),
    FOREIGN KEY (template_id) REFERENCES templates(template_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);
CREATE INDEX idx_templates_last_used_at ON templates(last_used_at DESC);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);