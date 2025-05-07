import { h } from "../../assets/preact.esm.js"
import NotesListToolbar from './NotesListToolbar.jsx';
import Link from '../../commons/components/Link.jsx';
import Spinner from '../../commons/components/Spinner.jsx';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import formatDate from '../../commons/utils/formatDate.js';
import ImageGallery from "./ImageGallery.jsx";

export default function NotesList({ notes = [], total, isLoading, view, onViewChange, onLoadMoreClick }) {
  let containerClassName = "notes-list-fragment";
  let listClassName = "notes-list";
  let items = notes.map(note => <NotesListItem note={note} key={note.noteId} />);
  let content = <div className="notes-list-spinner"><Spinner /></div>;

  if (view === "card") {
    containerClassName = "notes-grid-fragment";
    listClassName = "notes-grid";
    items = notes.map(note => <NotesGridItem note={note} key={note.noteId} />);
  } else if (view === "gallery") {
    containerClassName = "notes-gallery-fragment";
    listClassName = "notes-gallery";
    items = <ImageGallery notes={notes} columnWidth={400} gutter={20}/>;
  }

  if (!isLoading) {
    content = (
      <div className={listClassName}>
        {items}
        <LoadMoreButton notes={notes} total={total} onLoadMoreClick={onLoadMoreClick} />
        <EmptyList notes={notes}/>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <NotesListToolbar onListViewClick={() => onViewChange("list")} onCardViewClick={() => onViewChange("card")} onGalleryViewClick={() => onViewChange("gallery")} />
      {content}
    </div>
  );
}

function NotesListItem({ note }) {
  const link = `/notes/${note.noteId}`;
  const updatedAt = formatDate(new Date(note.updatedAt))
  const tags = note.tags?.map(tag => <div className="notes-list-item-tag" key={tag.name}>{tag.name}</div>);
  let title = <div className="notes-list-item-title">{note.title}</div>

  if (note.title === "") {
    let preview = note.snippet.split(" ").slice(0, 10).join(" ");
    if (preview.startsWith("![](/images/")) {
      preview = "Image";
    }
    title = <div className="notes-list-item-title untitled">{preview}</div>
  }

  return (
    <Link to={link} className="notes-list-item" activeClassName="is-active" shouldPreserveSearchParams>
      {title}
      <div className="notes-list-item-subcontainer">
        <div className="notes-list-item-tags">{tags}</div>
        <div className="notes-list-item-subtext" title={note.updatedAt}>{updatedAt}</div>
      </div>
    </Link>
  );
}

function NotesGridItem({ note }) {
  const link = `/notes/${note.noteId}`;
  const tags = note.tags?.map(tag => (<Link className="tag" key={tag.tagId} to={`/notes/?tagId=${tag.tagId}`} shouldPreserveSearchParams>{tag.name}</Link>));
  let title = <div className="notes-grid-item-title">{note.title}</div>

  if (note.title === "") {
    title = null;
  }

  return (
    <Link className="notes-grid-item" to={link} shouldPreserveSearchParams>
      {title}
      <div className="notes-grid-item-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.snippet) }} />
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