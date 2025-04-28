import { h, render, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import { SearchIcon, NoteIcon, ArchiveIcon, TrashIcon } from "../../commons/components/Icon.jsx";

export default function SearchMenu() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults([]);
      return;
    }

    ApiClient.search(value)
      .then(notes => {
        setResults(notes);
        if (notes.length > 0) {
          setSelectedItem(notes[0]);
        }
      })
      .catch(error => {
        console.error("Error searching:", error);
      });
  }

  function handleKeyUp(e) {
    if (e.key === "ArrowDown") {
      const nextIndex = results.indexOf(selectedItem) + 1;
      if (nextIndex < results.length) {
        setSelectedItem(results[nextIndex]);
      } else {
        setSelectedItem(results[0]);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      const prevIndex = results.indexOf(selectedItem) - 1;
      if (prevIndex >= 0) {
        setSelectedItem(results[prevIndex]);
      } else {
        setSelectedItem(results[results.length - 1]);
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
    navigateTo(`/notes/${item.noteId}`);
    closeModal();
  }

  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      closeModal();
    }
  }

  const items = results.map((item, index) => {
    const isSelected = item.noteId === selectedItem?.noteId;
    return (
      <SearchResultItem key={index} item={item} isSelected={isSelected} onClick={e => handleResultClick(item)} />
    )
  });

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
          {items}
        </div>
      </div>
    </div>
  );
}

function SearchResultItem({ item, isSelected, onClick }) {
  let icon = <NoteIcon />

  if (item.isArchived) {
    icon = <ArchiveIcon />
  } else if (item.isDeleted) {
    icon = <TrashIcon />
  }

  return (
    <div className={`search-result-item ${isSelected ? "is-selected" : ""}`} onClick={onClick}>
      {icon}
      <div className="search-result-item-content">
        <p className="title">{item.title}</p>
        <p className="subtitle">{item.snippet}</p>
      </div>
    </div>
  );
}

