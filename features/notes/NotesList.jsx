import { h } from "../../assets/preact.esm.js"
import NotesListToolbar from './NotesListToolbar.jsx';
import Link from '../../commons/components/Link.jsx';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';

export default function NotesList({ notes = [], view, onViewChange }) {
  let containerClassName = "notes-list-fragment";
  let listClassName = "notes-list";
  let items = notes.map(note => <NotesListItem note={note} key={note.NoteID} />);

  if (view === "grid") {
    containerClassName = "notes-grid-fragment";
    listClassName = "notes-grid";
    items = notes.map(note => <NotesGridItem note={note} key={note.NoteID} />);
  }

  return (
    <div className={containerClassName}>
      <NotesListToolbar onListViewClick={() => onViewChange("list")} onGridViewClick={() => onViewChange("grid")}/>
      <div className={listClassName}>
        {items}
        <EmptyList notes={notes} />
      </div>
    </div>
  );
}

function NotesListItem({ note }) {
  const link = `/notes/${note.NoteID}`;
  const updatedAt = new Date(note.UpdatedAt).toISOString().split('T')[0].replace(/-/g, '/');
  const tags = note.Tags?.map(tag => <div className="notes-list-item-subtext" key={tag.name}>{tag.name}</div>);
  let title = <div className="notes-list-item-title">{note.Title}</div>

  if (note.Title === "") {
    title = <div className="notes-list-item-title untitled">Untitled</div>
  }

  return (
    <div className="notes-list-item">
      <Link to={link} shouldPreserveSearchParams>
        {title}
        <div className="notes-list-item-subcontainer">
          <div className="notes-list-item-subtext">{updatedAt}</div>
          <div className="notes-list-item-tags">{tags}</div>
        </div>
      </Link>
    </div>
  );
}

function NotesGridItem({ note }) {
  const link = `/notes/${note.NoteID}`;
  let title = <div className="notes-grid-item-title">{note.Title}</div>

  if (note.Title === "") {
    title = null;
  }

  return (
    <div className="notes-grid-item">
      <Link to={link} shouldPreserveSearchParams>
        {title}
        <div className="notes-grid-item-content"  dangerouslySetInnerHTML={{ __html: renderMarkdown(note.Snippet) }}/>
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