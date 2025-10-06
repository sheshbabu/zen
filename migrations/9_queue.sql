CREATE TABLE IF NOT EXISTS queue (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_name     TEXT NOT NULL,
    payload        TEXT NOT NULL,
    status         TEXT NOT NULL,
    retry_count    INTEGER DEFAULT 0,
    max_retries    INTEGER DEFAULT 3,
    error_message  TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queue_processing ON queue (queue_name, status, created_at);