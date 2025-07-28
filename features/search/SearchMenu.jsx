import { h, render, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import { SearchIcon, NoteIcon, ArchiveIcon, TrashIcon, TagIcon } from "../../commons/components/Icon.jsx";
import "./SearchMenu.css";

const SEARCH_HISTORY_KEY = 'search-history';
const MAX_HISTORY_ENTRIES = 5;

export default function SearchMenu() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ notes: [], tags: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const inputRef = useRef(null);

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
      setResults({ notes: [], tags: [] });
      setSelectedItem(searchHistory.length > 0 ? searchHistory[0] : null);
      return;
    }

    ApiClient.search(value)
      .then(searchResults => {
        setResults(searchResults);
        const allItems = [...searchResults.notes, ...searchResults.tags];
        if (allItems.length > 0) {
          setSelectedItem(allItems[0]);
        }
      });
  }

  function handleKeyUp(e) {
    const allItems = query.trim() === "" ? searchHistory : [...results.notes, ...results.tags];

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

  function closeModal() {
    render(null, document.querySelector('.modal-root'));
  }

  function handleResultClick(item) {
    saveToSearchHistory(item);
    if (item.noteId) {
      navigateTo(`/notes/${item.noteId}`);
    } else if (item.tagId) {
      navigateTo(`/?tagId=${item.tagId}`);
    }
    closeModal();
  }

  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      closeModal();
    }
  }

  let historySection = null;
  let notesSection = null;
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
    if (results.notes.length > 0) {
      const noteItems = results.notes.map((item, index) => {
        const isSelected = item.noteId === selectedItem?.noteId;
        return (
          <SearchResultItem key={`note-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} />
        )
      });

      notesSection = (
        <div className="search-section">
          <h4 className="search-section-title">Notes</h4>
          {noteItems}
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
    <div className="modal-backdrop-container" onClick={handleBackdropClick}>
      <div className="modal-content-container search-modal">
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
          {notesSection}
          {tagsSection}
        </div>
      </div>
    </div>
  );
}

function SearchResultItem({ item, isSelected, onClick }) {
  let icon = <NoteIcon />
  let title = item.title || item.name
  let subtitle = item.snippet || ""

  if (item.tagId) {
    icon = <TagIcon />
    subtitle = "Tag"
  } else if (item.isArchived) {
    icon = <ArchiveIcon />
  } else if (item.isDeleted) {
    icon = <TrashIcon />
  }

  return (
    <div className={`search-result-item ${isSelected ? "is-selected" : ""}`} onClick={onClick}>
      {icon}
      <div className="search-result-item-content">
        <p className="title">{title}</p>
        <p className="subtitle">{subtitle}</p>
      </div>
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