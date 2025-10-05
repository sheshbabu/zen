import { h, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import { SearchIcon } from "../../commons/components/Icon.jsx";
import renderMarkdown from "../../commons/utils/renderMarkdown.js";
import "./CanvasNotePicker.css";

export default function CanvasNotePicker({ onAddNote, addedItems }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ lexical_notes: [], semantic_notes: [], semantic_images: [] });

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  let lexicalNotesSection = null;
  let semanticNotesSection = null;
  let semanticImagesSection = null;

  if (results.lexical_notes.length > 0) {
    const filteredNotes = results.lexical_notes.filter(item => !addedItems.has(item.noteId));

    if (filteredNotes.length > 0) {
      const noteItems = filteredNotes.map((item, index) => {
        return (
          <NoteCard key={`lexical-note-${index}`} note={item} onClick={() => handleResultClick(item)} />
        );
      });

      lexicalNotesSection = (
        <div className="canvas-note-picker-section">
          <h4 className="canvas-note-picker-section-title">Notes</h4>
          <div className="canvas-note-picker-grid">
            {noteItems}
          </div>
        </div>
      );
    }
  }

  if (results.semantic_notes.length > 0) {
    const filteredNotes = results.semantic_notes.filter(item => !addedItems.has(item.noteId));

    if (filteredNotes.length > 0) {
      const noteItems = filteredNotes.map((item, index) => {
        return (
          <NoteCard key={`semantic-note-${index}`} note={item} onClick={() => handleResultClick(item)} />
        );
      });

      semanticNotesSection = (
        <div className="canvas-note-picker-section">
          <h4 className="canvas-note-picker-section-title">Similar Notes</h4>
          <div className="canvas-note-picker-grid">
            {noteItems}
          </div>
        </div>
      );
    }
  }

  if (results.semantic_images.length > 0) {
    const filteredImages = results.semantic_images.filter(item => !addedItems.has(item.filename));

    if (filteredImages.length > 0) {
      const imageItems = filteredImages.map((item, index) => {
        return (
          <ImageCard key={`image-${index}`} image={item} onClick={() => handleResultClick(item)} />
        );
      });

      semanticImagesSection = (
        <div className="canvas-note-picker-section">
          <h4 className="canvas-note-picker-section-title">Similar Images</h4>
          <div className="canvas-note-picker-images">
            {imageItems}
          </div>
        </div>
      );
    }
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
      <div className="canvas-note-picker-results">
        {lexicalNotesSection}
        {semanticNotesSection}
        {semanticImagesSection}
      </div>
    </div>
  );
}

function NoteCard({ note, onClick }) {
  const hasTitle = note.title && note.title.length > 0;

  let header = null;
  if (hasTitle) {
    header = (
      <div className="canvas-note-card-header">
        <div className="canvas-note-card-title">{note.title}</div>
      </div>
    );
  }

  return (
    <div className="canvas-note-card" onClick={onClick}>
      {header}
      <div className="canvas-note-card-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.snippet || note.content || note.matchText || '') }} />
    </div>
  );
}

function ImageCard({ image, onClick }) {
  return (
    <img
      src={`/images/${image.filename}`}
      className="canvas-image-card"
      onClick={onClick}
      loading="lazy"
    />
  );
}

