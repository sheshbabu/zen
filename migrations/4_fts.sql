-- https://www.sqlite.org/fts5.html#external_content_tables

CREATE VIRTUAL TABLE notes_search USING fts5(title, content, content='notes', content_rowid='note_id', tokenize="trigram");

INSERT INTO notes_search (rowid, title, content) SELECT note_id, title, content FROM notes;

CREATE TRIGGER notes_after_insert_trigger AFTER INSERT ON notes BEGIN
  INSERT INTO notes_search (rowid, title, content) VALUES (NEW.note_id, NEW.title, NEW.content);
END;

CREATE TRIGGER notes_after_delete_trigger AFTER DELETE ON notes BEGIN
  INSERT INTO notes_search(notes_search, rowid, title, content) VALUES('delete', OLD.note_id, OLD.title, OLD.content);
END;

CREATE TRIGGER notes_after_update_trigger AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_search(notes_search, rowid, title, content) VALUES('delete', OLD.note_id, OLD.title, OLD.content);
  INSERT INTO notes_search(rowid, title, content) VALUES (NEW.note_id, NEW.title, NEW.content);
END;