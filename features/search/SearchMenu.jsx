import { h, render, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import Link from "../../commons/components/Link.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";

export default function SearchMenu() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
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
      })
      .catch(error => {
        console.error("Error searching:", error);
      });
  }

  function closeModal() {
    render(null, document.querySelector('.modal-root'));
  }

  function handleResultClick(item) {
    navigateTo(`/notes/${item.NoteID}`);
    closeModal();
  }

  const items = results.map((item, index) => <SearchResultItem key={index} item={item} onClick={e => handleResultClick(item)}/>);

  return (
    <div className="modal-backdrop-container">
      <div className="modal-content-container search-modal">
        <input
          type="text"
          placeholder="Search..."
          ref={inputRef}
          value={query}
          onInput={handleChange}
        />
        {items}
      </div>
    </div>
  );
}

function SearchResultItem({ item, onClick }) {
  return (
    <div className="search-result-item" onClick={onClick}>
      <p>{item.Title}</p>
    </div>
  );
}

