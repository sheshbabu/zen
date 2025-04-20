import { h, render, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import { SearchIcon, NoteIcon } from "../../commons/components/Icon.jsx";

export default function SearchMenu() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults([]);
      return;
    }

    ApiClient.search(value)
      .then(response => {
        setResults(response.notes);
        if (response.notes.length > 0) {
          setSelectedItem(response.notes[0]);
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
    navigateTo(`/notes/${item.NoteID}`);
    closeModal();
  }

  const items = results.map((item, index) => {
    const isSelected = item.NoteID === selectedItem?.NoteID;
    return (
      <SearchResultItem key={index} item={item} isSelected={isSelected} onClick={e => handleResultClick(item)} />
    )
  });

  return (
    <div className="modal-backdrop-container">
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
        {items}
      </div>
    </div>
  );
}

function SearchResultItem({ item, isSelected, onClick }) {
  return (
    <div className={`search-result-item ${isSelected ? "is-selected" : ""}`} onClick={onClick}>
      <NoteIcon />
      <div className="search-result-item-content">
        <p className="title">{item.Title}</p>
        <p className="subtitle">{item.Snippet}</p>
      </div>
    </div>
  );
}

