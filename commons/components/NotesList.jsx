import { h } from '../../dependencies/preact.esm.js';
import NotesListToolbar from './NotesListToolbar.jsx';
import Link from './Link.jsx';

export default function NotesList({ notes = [] }) {
  const items = notes.map(note => <NotesListItem note={note} key={note.NoteID} />);

  return (
    <div className="notes-list-fragment">
      <NotesListToolbar />
      <div className="notes-list">
        {items}
        <EmptyList notes={notes} />
      </div>
    </div>
  );
}

function NotesListItem({ note }) {
  const link = `/${note.NoteID}`;
  const updatedAt = new Date(note.UpdatedAt).toISOString().split('T')[0].replace(/-/g, '/');
  const tags = note.Tags?.map(tag => <div className="notes-list-item-subtext" key={tag.name}>{tag.name}</div>);
  let title = <div className="notes-list-item-title">{note.Title}</div>

  if (note.Title === "") {
    title = <div className="notes-list-item-title untitled">Untitled</div>
  }

  return (
    <div className="notes-list-item">
      <Link to={link}>
        {title}
        <div className="notes-list-item-subcontainer">
          <div className="notes-list-item-subtext">{updatedAt}</div>
          <div className="notes-list-item-tags">{tags}</div>
        </div>
      </Link>
    </div>
  );
}

function EmptyList({ notes }) {
  if (notes.length > 0) {
    return null;
  }

  return <div className="notes-list-empty-text">No notes found</div>
}


