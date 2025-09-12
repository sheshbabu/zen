ALTER TABLE notes ADD COLUMN pinned_at TIMESTAMP DEFAULT NULL;

CREATE INDEX idx_notes_pinned_at ON notes(pinned_at) WHERE pinned_at IS NOT NULL;