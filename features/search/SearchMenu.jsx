import { h, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import { SearchIcon, NoteIcon, ArchiveIcon, TrashIcon, TagIcon } from "../../commons/components/Icon.jsx";
import { ModalBackdrop, ModalContainer, closeModal } from "../../commons/components/Modal.jsx";
import "./SearchMenu.css";

const SEARCH_HISTORY_KEY = 'search-history';
const MAX_HISTORY_ENTRIES = 5;

export default function SearchMenu() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ lexical_notes: [], semantic_notes: [], semantic_images: [], tags: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const inputRef = useRef(null);

  function handleCloseModal() {
    closeModal();
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setSearchHistory(getSearchHistory());
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults({ lexical_notes: [], semantic_notes: [], semantic_images: [], tags: [] });
      setSelectedItem(searchHistory.length > 0 ? searchHistory[0] : null);
      return;
    }

    ApiClient.search(value)
      .then(searchResults => {
        setResults(searchResults);
        const allItems = [...searchResults.lexical_notes, ...searchResults.semantic_notes, ...searchResults.semantic_images, ...searchResults.tags];
        if (allItems.length > 0) {
          setSelectedItem(allItems[0]);
        }
      });
  }

  function handleKeyUp(e) {
    let allItems = [];
    if (query.trim() === "") {
      allItems = searchHistory;
    } else {
      allItems = [...results.lexical_notes, ...results.semantic_notes, ...results.semantic_images, ...results.tags];
    }

    if (e.key === "ArrowDown") {
      const nextIndex = allItems.indexOf(selectedItem) + 1;
      if (nextIndex < allItems.length) {
        setSelectedItem(allItems[nextIndex]);
      } else {
        setSelectedItem(allItems[0]);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      const prevIndex = allItems.indexOf(selectedItem) - 1;
      if (prevIndex >= 0) {
        setSelectedItem(allItems[prevIndex]);
      } else {
        setSelectedItem(allItems[allItems.length - 1]);
      }
      return;
    }

    if (e.key === 'Enter' && selectedItem) {
      handleResultClick(selectedItem);
      return;
    }
  }


  function handleResultClick(item) {
    if (item.noteId) {
      saveToSearchHistory(item);
      navigateTo(`/notes/${item.noteId}`);
      closeModal();
    } else if (item.tagId) {
      saveToSearchHistory(item);
      navigateTo(`/?tagId=${item.tagId}`);
      closeModal();
    } else if (item.filename) {
      // For semantic image results, we don't navigate anywhere yet
      // This could be enhanced later to show image details or navigate to related notes
      closeModal();
    }
  }


  let historySection = null;
  let lexicalNotesSection = null;
  let semanticNotesSection = null;
  let semanticImagesSection = null;
  let tagsSection = null;

  if (query.trim() === "" && searchHistory.length > 0) {
    const historyItems = searchHistory.map((item, index) => {
      const isSelected = (item.noteId && item.noteId === selectedItem?.noteId) || (item.tagId && item.tagId === selectedItem?.tagId);
      return (
        <SearchResultItem key={`history-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} />
      )
    });

    historySection = (
      <div className="search-section">
        <h4 className="search-section-title">Recent</h4>
        {historyItems}
      </div>
    );
  } else {
    if (results.lexical_notes.length > 0) {
      const noteItems = results.lexical_notes.map((item, index) => {
        const isSelected = item.noteId === selectedItem?.noteId;
        return (
          <SearchResultItem key={`lexical-note-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} />
        )
      });

      lexicalNotesSection = (
        <div className="search-section">
          <h4 className="search-section-title">Notes</h4>
          {noteItems}
        </div>
      );
    }

    if (results.semantic_notes.length > 0) {
      const noteItems = results.semantic_notes.map((item, index) => {
        const isSelected = item.noteId === selectedItem?.noteId;
        return (
          <SearchResultItem key={`semantic-note-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} />
        )
      });

      semanticNotesSection = (
        <div className="search-section">
          <h4 className="search-section-title">Similar Notes</h4>
          {noteItems}
        </div>
      );
    }

    if (results.semantic_images.length > 0) {
      semanticImagesSection = (
        <div className="search-section">
          <h4 className="search-section-title">Similar Images</h4>
          <SearchResultImages items={results.semantic_images} onClick={handleResultClick} />
        </div>
      );
    }

    if (results.tags.length > 0) {
      const tagItems = results.tags.map((item, index) => {
        const isSelected = item.tagId === selectedItem?.tagId;
        return (
          <SearchResultItem key={`tag-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} />
        )
      });

      tagsSection = (
        <div className="search-section">
          <h4 className="search-section-title">Tags</h4>
          {tagItems}
        </div>
      );
    }
  }

  return (
    <ModalBackdrop onClose={handleCloseModal} isCentered={false}>
      <ModalContainer className="search-modal">
        <div className="search-input-container">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search..."
            ref={inputRef}
            value={query}
            onInput={handleChange}
            onKeyUp={handleKeyUp}
          />
        </div>
        <div className="search-results-container">
          {historySection}
          {lexicalNotesSection}
          {semanticNotesSection}
          {semanticImagesSection}
          {tagsSection}
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}

function SearchResultItem({ item, isSelected, onClick }) {
  let icon = <NoteIcon />
  let title = item.title || item.name
  let subtitle = ""

  if (item.tagId) {
    icon = <TagIcon />
    subtitle = "Tag"
  } else if (item.isArchived) {
    icon = <ArchiveIcon />
  } else if (item.isDeleted) {
    icon = <TrashIcon />
  }

  const displayTitle = item.highlightedTitle || title || ""

  let displaySubtitle = subtitle
  if (item.highlightedContent) {
    displaySubtitle = getHighlightedSnippet(item.highlightedContent)
  } else if (item.content) {
    displaySubtitle = item.content
  } else if (item.matchText) {
    // For semantic note results
    displaySubtitle = item.matchText
  }

  return (
    <div className={`search-result-item ${isSelected ? "is-selected" : ""}`} onClick={onClick}>
      {icon}
      <div className="search-result-item-content">
        <p className="title" dangerouslySetInnerHTML={{ __html: displayTitle }}></p>
        <p className="subtitle" dangerouslySetInnerHTML={{ __html: displaySubtitle }}></p>
      </div>
    </div>
  );
}

function SearchResultImages({ items, onClick }) {
  const images = items.map(item => <img src={`/images/${item.filename}`} key={item.filename} alt={item.description} onClick={() => onClick(item)} />)

  return (
    <div className="search-result-images">
      {images}
    </div>
  );
}

function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

function saveToSearchHistory(item) {
  try {
    let history = getSearchHistory();

    const existingIndex = history.findIndex(h =>
      (h.noteId && h.noteId === item.noteId) ||
      (h.tagId && h.tagId === item.tagId)
    );

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    history.unshift(item);

    if (history.length > MAX_HISTORY_ENTRIES) {
      history = history.slice(0, MAX_HISTORY_ENTRIES);
    }

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore localStorage errors
  }
}

function getHighlightedSnippet(highlightedContent) {
  if (!highlightedContent || !highlightedContent.includes('<mark>')) {
    return highlightedContent;
  }

  const maxLength = 100;
  const leftOffset = 10;
  const markStart = highlightedContent.indexOf('<mark>');
  const startPos = Math.max(0, markStart - leftOffset);

  let snippet = highlightedContent.substring(startPos, startPos + maxLength);

  const lastMarkStart = snippet.lastIndexOf('<mark>');
  const lastMarkEnd = snippet.lastIndexOf('</mark>');

  if (lastMarkStart > lastMarkEnd) {
    const remainingContent = highlightedContent.substring(startPos + maxLength);
    const nextMarkEnd = remainingContent.indexOf('</mark>');
    if (nextMarkEnd !== -1) {
      snippet += remainingContent.substring(0, nextMarkEnd + 7);
    }
  }

  if (startPos > 0) {
    snippet = '...' + snippet;
  }
  if (startPos + snippet.length < highlightedContent.length) {
    snippet += '...';
  }

  return snippet;
}