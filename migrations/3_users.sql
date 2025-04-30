CREATE TABLE IF NOT EXISTS users (
	user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
	email         TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	is_admin      INTEGER DEFAULT 0,
  	created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  	updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    expires_at TEXT,

    FOREIGN KEY (user_id) 
        REFERENCES users(user_id)
        ON UPDATE CASCADE 
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS config (
	key        TEXT PRIMARY KEY,
	value      TEXT NOT NULL,
  	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);