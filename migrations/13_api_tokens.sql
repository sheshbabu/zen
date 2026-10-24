ALTER TABLE mcp_tokens RENAME TO api_tokens;

DELETE FROM api_tokens WHERE is_active = 0;

ALTER TABLE api_tokens DROP COLUMN is_active;

CREATE TABLE api_token_scopes (
    token_id  INTEGER NOT NULL,
    tag_id    INTEGER NOT NULL,
    can_read  INTEGER NOT NULL DEFAULT 0,
    can_write INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (token_id, tag_id),
    FOREIGN KEY (token_id) REFERENCES api_tokens (token_id) ON DELETE CASCADE
);

INSERT INTO api_token_scopes (token_id, tag_id, can_read)
SELECT token_id, 0, 1 FROM api_tokens;
