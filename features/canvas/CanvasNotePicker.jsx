import { h, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import { SearchIcon } from "../../commons/components/Icon.jsx";
import Button from "../../commons/components/Button.jsx";
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import "./CanvasNotePicker.css";

export default function CanvasNotePicker({ onAddNote, addedItems }) {
  const [query, setQuery] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [results, setResults] = useState({ lexical_notes: [], semantic_notes: [], semantic_images: [] });
  const [browseNotes, setBrowseNotes] = useState([]);
  const [browseImages, setBrowseImages] = useState([]);
  const [notesPage, setNotesPage] = useState(1);
  const [notesTotal, setNotesTotal] = useState(0);

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const tagId = filterTag === null ? null : filterTag.tagId;

    setBrowseNotes([]);
    setBrowseImages([]);
    setNotesPage(1);

    ApiClient.getNotes(tagId, null, false, false, 1)
      .then(response => {
        setBrowseNotes(response.notes || []);
        setNotesTotal(response.total);
      });

    ApiClient.getImages(tagId, null, 1)
      .then(response => {
        setBrowseImages(response.images || []);
      });
  }, [filterTag]);

  function loadMoreNotes() {
    const tagId = filterTag === null ? null : filterTag.tagId;
    const nextPage = notesPage + 1;

    ApiClient.getNotes(tagId, null, false, false, nextPage)
      .then(response => {
        setBrowseNotes(prev => [...prev, ...(response.notes || [])]);
        setNotesTotal(response.total);
        setNotesPage(nextPage);
      });
  }

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim() === "") {
      setResults({ lexical_notes: [], semantic_notes: [], semantic_images: [] });
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      ApiClient.search(value)
        .then(searchResults => {
          setResults({
            lexical_notes: searchResults.lexical_notes || [],
            semantic_notes: searchResults.semantic_notes || [],
            semantic_images: searchResults.semantic_images || [],
          });
        });
    }, 200);
  }

  function handleResultClick(item) {
    if (item.noteId || item.filename) {
      onAddNote(item);
    }
  }

  function handleAddFilterTag(tag) {
    setFilterTag(tag);
  }

  function handleRemoveFilterTag() {
    setFilterTag(null);
  }

  function hasTag(note) {
    if (filterTag === null) {
      return true;
    }
    return note.tags?.some(tag => tag.tagId === filterTag.tagId) === true;
  }

  const isSearching = query.trim() !== "";
  let sections = [];

  if (isSearching) {
    // Search results carry no tags, so a tag filter can only be applied to notes
    const lexicalNotes = results.lexical_notes.filter(item => !addedItems.has(item.noteId) && hasTag(item));
    const semanticNotes = results.semantic_notes.filter(item => !addedItems.has(item.noteId) && hasTag(item));
    const semanticImages = results.semantic_images.filter(item => !addedItems.has(item.filename));

    if (lexicalNotes.length > 0) {
      sections.push(<NotesSection key="lexical" title="Notes" notes={lexicalNotes} keyPrefix="lexical" onResultClick={handleResultClick} />);
    }

    if (semanticNotes.length > 0) {
      sections.push(<NotesSection key="semantic" title="Similar Notes" notes={semanticNotes} keyPrefix="semantic" onResultClick={handleResultClick} />);
    }

    if (semanticImages.length > 0 && filterTag === null) {
      sections.push(<ImagesSection key="images" title="Similar Images" images={semanticImages} keyPrefix="search-image" onResultClick={handleResultClick} />);
    }
  } else {
    const notes = browseNotes.filter(item => !addedItems.has(item.noteId));
    const images = browseImages.filter(item => !addedItems.has(item.filename));

    if (notes.length > 0) {
      sections.push(<NotesSection key="browse-notes" title="Notes" notes={notes} keyPrefix="browse-note" onResultClick={handleResultClick} />);
    }

    if (images.length > 0) {
      sections.push(<ImagesSection key="browse-images" title="Images" images={images} keyPrefix="browse-image" onResultClick={handleResultClick} />);
    }
  }

  let emptyState = null;
  if (sections.length === 0) {
    let emptyMessage = "No notes or images available";
    if (isSearching) {
      emptyMessage = "No results found";
    }
    emptyState = <div className="canvas-note-picker-empty">{emptyMessage}</div>;
  }

  let loadMoreButton = null;
  if (!isSearching) {
    loadMoreButton = <LoadMoreButton items={browseNotes} total={notesTotal} onLoadMoreClick={loadMoreNotes} />;
  }

  return (
    <div className="canvas-note-picker">
      <div className="canvas-note-picker-input-container">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search..."
          ref={inputRef}
          value={query}
          onInput={handleChange}
        />
      </div>
      <div className="canvas-note-picker-filters">
        <NotesEditorTags
          tags={filterTag === null ? [] : [filterTag]}
          isEditable
          canCreateTag={false}
          placeholder="Filter by tag..."
          onAddTag={handleAddFilterTag}
          onRemoveTag={handleRemoveFilterTag}
        />
      </div>
      <div className="canvas-note-picker-results">
        {sections}
        {emptyState}
        {loadMoreButton}
      </div>
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

  return <Button className="notes-list-load-more-button" onClick={onLoadMoreClick}>Load more</Button>
}

function NotesSection({ title, notes, keyPrefix, onResultClick }) {
  const noteItems = notes.map((note, index) => {
    return (
      <NoteCard key={`${keyPrefix}-${index}`} note={note} onClick={() => onResultClick(note)} />
    );
  });

  return (
    <div className="canvas-note-picker-section">
      <h4 className="canvas-note-picker-section-title">{title}</h4>
      {noteItems}
    </div>
  );
}

function ImagesSection({ title, images, keyPrefix, onResultClick }) {
  const imageItems = images.map((image, index) => {
    return (
      <ImageCard key={`${keyPrefix}-${index}`} image={image} onClick={() => onResultClick(image)} />
    );
  });

  return (
    <div className="canvas-note-picker-section">
      <h4 className="canvas-note-picker-section-title">{title}</h4>
      <div className="canvas-note-picker-images-grid">
        {imageItems}
      </div>
    </div>
  );
}

function NoteCard({ note, onClick }) {
  let title = <div className="notes-list-item-title">{note.title}</div>;

  if (note.title === "") {
    let preview = (note.snippet || note.content || note.matchText || "").split(" ").slice(0, 10).join(" ");
    if (preview.startsWith("![](/images/")) {
      preview = "Image";
    }
    title = <div className="notes-list-item-title untitled">{preview}</div>;
  }

  const tags = note.tags?.map(tag => <div className="notes-list-item-tag" key={tag.tagId}>{tag.name}</div>);

  return (
    <div className="notes-list-item" onClick={onClick}>
      {title}
      <div className="notes-list-item-subcontainer">
        <div className="notes-list-item-tags">{tags}</div>
      </div>
    </div>
  );
}

function ImageCard({ image, onClick }) {
  return (
    <img
      src={`/images/${image.filename}`}
      className="canvas-image-card-grid"
      onClick={onClick}
      loading="lazy"
    />
  );
}
