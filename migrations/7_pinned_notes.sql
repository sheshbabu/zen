-- Migration: 7_pinned_notes.sql
-- Add pinned_at column to notes table for pinned notes feature

ALTER TABLE notes ADD COLUMN pinned_at TIMESTAMP DEFAULT NULL;

-- Create index for efficient querying of pinned notes
CREATE INDEX idx_notes_pinned_at ON notes(pinned_at) WHERE pinned_at IS NOT NULL;