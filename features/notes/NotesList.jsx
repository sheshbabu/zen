import { h } from "../../assets/preact.esm.js"
import NotesListToolbar from './NotesListToolbar.jsx';
import Link from '../../commons/components/Link.jsx';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import formatDate from '../../commons/utils/formatDate.js';

export default function NotesList({ notes = [], total, view, onViewChange, onLoadMoreClick }) {
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
      <NotesListToolbar onListViewClick={() => onViewChange("list")} onGridViewClick={() => onViewChange("grid")} />
      <div className={listClassName}>
        {items}
        <LoadMoreButton notes={notes} total={total} onLoadMoreClick={onLoadMoreClick}/>
        <EmptyList notes={notes} />
      </div>
    </div>
  );
}

function NotesListItem({ note }) {
  const link = `/notes/${note.NoteID}`;
  const updatedAt = formatDate(new Date(note.UpdatedAt))
  const tags = note.Tags?.map(tag => <div className="notes-list-item-tag" key={tag.name}>{tag.name}</div>);
  let title = <div className="notes-list-item-title">{note.Title}</div>

  if (note.Title === "") {
    title = <div className="notes-list-item-title untitled">&nbsp;</div>
  }

  return (
    <Link to={link} className="notes-list-item" activeClassName="is-active" shouldPreserveSearchParams>
      {title}
      <div className="notes-list-item-subcontainer">
        <div className="notes-list-item-tags">{tags}</div>
        <div className="notes-list-item-subtext" title={note.UpdatedAt}>{updatedAt}</div>
      </div>
    </Link>
  );
}

function NotesGridItem({ note }) {
  const link = `/notes/${note.NoteID}`;
  const tags = note.Tags?.map(tag => (<Link className="tag" key={tag.tag_id} to={`/notes/?tag_id=${tag.tag_id}`} shouldPreserveSearchParams>{tag.name}</Link>));
  let title = <div className="notes-grid-item-title">{note.Title}</div>

  if (note.Title === "") {
    title = null;
  }

  return (
    <Link className="notes-grid-item" to={link} shouldPreserveSearchParams>
      {title}
      <div className="notes-grid-item-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.Snippet) }} />
      <div className="notes-grid-item-tags">{tags}</div>
    </Link>
  );
}

function LoadMoreButton({ notes, total, onLoadMoreClick }) {
  if (notes.length === 0) {
    return null;
  }

  if (notes.length === total) {
    return null;
  }

  return <div className="notes-list-load-more-button" onClick={onLoadMoreClick}>Load more</div>
}

function EmptyList({ notes }) {
  if (notes.length > 0) {
    return null;
  }

  return <div className="notes-list-empty-text">No notes found</div>
}