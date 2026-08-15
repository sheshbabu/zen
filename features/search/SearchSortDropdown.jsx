import { h, useState, useEffect, useRef } from "../../assets/preact.esm.js";
import { ArrowDownIcon } from "../../commons/components/Icon.jsx";
import "./SearchSortDropdown.css";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Best matches" },
  { value: "updated", label: "Last edited" },
  { value: "created", label: "Created" },
];

export default function SearchSortDropdown({ activeSort, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current !== null && containerRef.current.contains(e.target) !== true) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  function handleToggleClick() {
    setIsOpen(prevIsOpen => prevIsOpen !== true);
  }

  function handleOptionClick(value) {
    setIsOpen(false);
    onSortChange(value);
  }

  const activeOption = SORT_OPTIONS.find(option => option.value === activeSort);

  let activeLabel = SORT_OPTIONS[0].label;
  if (activeOption !== undefined) {
    activeLabel = activeOption.label;
  }

  const options = SORT_OPTIONS.map(option => {
    const isActive = option.value === activeSort;
    return (
      <li
        key={option.value}
        className={`search-sort-dropdown-option ${isActive === true ? "is-active" : ""}`}
        onClick={() => handleOptionClick(option.value)}
      >
        {option.label}
      </li>
    );
  });

  return (
    <div ref={containerRef} className={`search-sort-dropdown ${isOpen === true ? "is-open" : ""}`}>
      <button className="search-sort-dropdown-toggle" onClick={handleToggleClick}>
        {activeLabel}
        <ArrowDownIcon />
      </button>
      <ul className="search-sort-dropdown-menu">
        {options}
      </ul>
    </div>
  );
}
