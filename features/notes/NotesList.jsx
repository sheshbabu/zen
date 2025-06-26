import { h, render, Fragment } from "../../assets/preact.esm.js"
import NotesListToolbar from './NotesListToolbar.jsx';
import Link from '../../commons/components/Link.jsx';
import Spinner from '../../commons/components/Spinner.jsx';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import formatDate from '../../commons/utils/formatDate.js';
import ImageGallery from "./ImageGallery.jsx";
import NotesEditorModal from './NotesEditorModal.jsx';

export default function NotesList({ notes = [], total, isLoading, images = [], imagesTotal, isImagesLoading, view, onViewChange, onLoadMoreClick, onLoadMoreImagesClick, onChange }) {
  let listClassName = "notes-list";
  let items = notes.map(note => <NotesListItem note={note} key={note.noteId} />);
  let content = <div className="notes-list-spinner"><Spinner /></div>;
  let loadMoreHandler = onLoadMoreClick;
  let currentTotal = total;
  let currentItems = notes;

  if (view === "card") {
    listClassName = "";
    items = notes.map(note => <NotesGridItem note={note} key={note.noteId} onChange={onChange} />);
    items = (
      <div className="notes-grid">
        {items}
      </div>
    );
  } else if (view === "gallery") {
    listClassName = "notes-gallery";
    items = <ImageGallery images={images} />;
    loadMoreHandler = onLoadMoreImagesClick;
    currentTotal = imagesTotal;
    currentItems = images;
  }

  if ((view === "gallery" && !isImagesLoading) || (view !== "gallery" && !isLoading)) {
    content = (
      <div className={listClassName}>
        {items}
        <LoadMoreButton items={currentItems} total={currentTotal} onLoadMoreClick={loadMoreHandler} />
        <EmptyList items={currentItems} view={view} />
      </div>
    )
  }

  return (
    <>
      <NotesListToolbar onListViewClick={() => onViewChange("list")} onCardViewClick={() => onViewChange("card")} onGalleryViewClick={() => onViewChange("gallery")} />
      {content}
    </>
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

function NotesGridItem({ note, onChange }) {
  const isMobile = window.matchMedia("(max-width: 948px)").matches;
  const link = `/notes/${note.noteId}`;
  const tags = note.tags?.map(tag => (<Link className="tag" key={tag.tagId} to={`/notes/?tagId=${tag.tagId}`} shouldPreserveSearchParams>{tag.name}</Link>));
  let title = <div className="notes-grid-item-title">{note.title}</div>

  if (note.title === "") {
    title = null;
  }

  function handleClick() {
    render(<NotesEditorModal note={note} onChange={onChange} />, document.querySelector('.note-modal-root'));
  }

  const content = (
    <>
      {title}
      <div className="notes-grid-item-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.snippet) }} />
      <div className="notes-grid-item-tags">{tags}</div>
    </>
  );

  if (isMobile) {
    return (
      <Link className="notes-grid-item" to={link} shouldPreserveSearchParams>
        {content}
      </Link>
    );
  }

  return (
    <div className="notes-grid-item" onClick={handleClick}>
      {content}
    </div>
  );
}

function LoadMoreButton({ items, total, onLoadMoreClick }) {
  if (items.length === 0) {
    return null;
  }

  if (items.length === total) {
    return null;
  }

  return <div className="notes-list-load-more-button" onClick={onLoadMoreClick}>Load more</div>
}

function EmptyList({ items, view }) {
  if (items.length > 0) {
    return null;
  }

  const message = view === "gallery" ? "No images found" : "No notes found";
  return <div className="notes-list-empty-text">{message}</div>
}