import { h, useEffect } from '../../dependencies/preact.esm.js';
import NotesListToolbar from './NotesListToolbar.jsx';

function NotesGrid({ notes = [], refreshLink }) {
  useEffect(() => {
    renderContent();
  }, [notes]);

  const renderContent = () => {
    document.querySelectorAll(".notes-grid-item-content").forEach((el) => {
      if (window.zen && window.zen.renderMarkdown) {
        el.innerHTML = window.zen.renderMarkdown(el.dataset.content);
      }
    });
  };

  return (
    <div className="notes-grid-fragment">
      <NotesListToolbar />
      <div className="notes-grid">
        {notes.map(note => (
          <div className="notes-grid-item" key={note.NoteID}>
            <a href={`/notes/${note.NoteID}`}>
              {note.Title && <div className="notes-grid-item-title">{note.Title}</div>}
              <div className="notes-grid-item-content"></div>
            </a>
          </div>
        ))}
        {!notes.length && (
          <div className="notes-list-empty-text">No notes found</div>
        )}
      </div>
    </div>
  );
}

export default NotesGrid;
