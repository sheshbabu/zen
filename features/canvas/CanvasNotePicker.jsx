import { h, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import { SearchIcon } from "../../commons/components/Icon.jsx";
import "./CanvasNotePicker.css";

export default function CanvasNotePicker({ onAddNote, addedItems }) {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ lexical_notes: [], semantic_notes: [], semantic_images: [] });
  const [browseNotes, setBrowseNotes] = useState([]);
  const [browseImages, setBrowseImages] = useState([]);
  const [notesPage, setNotesPage] = useState(1);
  const [imagesPage, setImagesPage] = useState(1);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [hasMoreImages, setHasMoreImages] = useState(true);

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (activeTab === "search" && inputRef.current) {
      inputRef.current.focus();
    } else if (activeTab === "notes" && browseNotes.length === 0) {
      loadMoreNotes();
    } else if (activeTab === "images" && browseImages.length === 0) {
      loadMoreImages();
    }
  }, [activeTab]);

  function loadMoreNotes() {
    ApiClient.getNotes(null, null, false, false, notesPage)
      .then(response => {
        if (response.notes && response.notes.length > 0) {
          setBrowseNotes(prev => [...prev, ...response.notes]);
          setNotesPage(prev => prev + 1);
          setHasMoreNotes(response.notes.length === 20);
        } else {
          setHasMoreNotes(false);
        }
      });
  }

  function loadMoreImages() {
    ApiClient.getImages(null, null, imagesPage)
      .then(response => {
        if (response.images && response.images.length > 0) {
          setBrowseImages(prev => [...prev, ...response.images]);
          setImagesPage(prev => prev + 1);
          setHasMoreImages(response.images.length === 20);
        } else {
          setHasMoreImages(false);
        }
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
          {noteItems}
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
          {noteItems}
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

  let tabContent;
  if (activeTab === "search") {
    tabContent = (
      <div className="canvas-note-picker-tab-content">
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
  } else if (activeTab === "notes") {
    const filteredNotes = browseNotes.filter(item => !addedItems.has(item.noteId));
    const noteItems = filteredNotes.map((item, index) => {
      return (
        <NoteCard key={`browse-note-${index}`} note={item} onClick={() => handleResultClick(item)} />
      );
    });

    let notesContent;
    if (filteredNotes.length === 0) {
      notesContent = <div className="canvas-note-picker-empty">No notes available</div>;
    } else {
      notesContent = (
        <div className="canvas-note-picker-results">
          {noteItems}
        </div>
      );
    }

    tabContent = (
      <div className="canvas-note-picker-tab-content">
        {notesContent}
        {hasMoreNotes === true && (
          <button className="canvas-note-picker-load-more" onClick={loadMoreNotes}>
            Load More
          </button>
        )}
      </div>
    );
  } else if (activeTab === "images") {
    const filteredImages = browseImages.filter(item => !addedItems.has(item.filename));

    let imagesContent;
    if (filteredImages.length === 0) {
      imagesContent = <div className="canvas-note-picker-empty">No images available</div>;
    } else {
      const imageItems = filteredImages.map((item, index) => {
        return (
          <ImageCardGrid key={`browse-image-${index}`} image={item} onClick={() => handleResultClick(item)} />
        );
      });

      imagesContent = (
        <div className="canvas-note-picker-images-grid">
          {imageItems}
        </div>
      );
    }

    tabContent = (
      <div className="canvas-note-picker-tab-content">
        {imagesContent}
        {hasMoreImages === true && (
          <button className="canvas-note-picker-load-more" onClick={loadMoreImages}>
            Load More
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="canvas-note-picker">
      <div className="canvas-note-picker-tabs">
        <button
          className={activeTab === "search" ? "canvas-note-picker-tab active" : "canvas-note-picker-tab"}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>
        <button
          className={activeTab === "notes" ? "canvas-note-picker-tab active" : "canvas-note-picker-tab"}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
        <button
          className={activeTab === "images" ? "canvas-note-picker-tab active" : "canvas-note-picker-tab"}
          onClick={() => setActiveTab("images")}
        >
          Images
        </button>
      </div>
      {tabContent}
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

  return (
    <div className="notes-list-item" onClick={onClick}>
      {title}
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

function ImageCardGrid({ image, onClick }) {
  return (
    <img
      src={`/images/${image.filename}`}
      className="canvas-image-card-grid"
      onClick={onClick}
      loading="lazy"
    />
  );
}

