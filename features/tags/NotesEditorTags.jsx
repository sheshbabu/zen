import { h, Fragment, useState, useEffect, useRef } from "../../assets/preact.esm.js"
import ApiClient from '../../commons/http/ApiClient.js';
import { RemoveIcon } from "../../commons/components/Icon.jsx";
import Link from "../../commons/components/Link.jsx";

export default function NotesEditorTags({ tags, isEditable, canCreateTag, onAddTag, onRemoveTag }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeSuggestions();
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownRef, closeSuggestions]);

  function handleKeyUp(e) {
    const value = e.target.value;

    if (e.key === "ArrowDown") {
      const nextIndex = suggestions.indexOf(selectedTag) + 1;
      if (nextIndex < suggestions.length) {
        setSelectedTag(suggestions[nextIndex]);
      } else {
        setSelectedTag(suggestions[0]);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      const prevIndex = suggestions.indexOf(selectedTag) - 1;
      if (prevIndex >= 0) {
        setSelectedTag(suggestions[prevIndex]);
      } else {
        setSelectedTag(suggestions[suggestions.length - 1]);
      }
      return;
    }

    if (e.key === 'Enter' && selectedTag) {
      if (selectedTag.tagId === -1) {
        onAddTag({ tagId: -1, name: value });
      } else {
        onAddTag(selectedTag);
      }
      closeSuggestions(e);
      return;
    }

    if (e.key === 'Escape') {
      closeSuggestions(e);
      return;
    }

    if (e.key === 'Backspace' && value === "") {
      closeSuggestions(e);
      return;
    }

    if (value === "") {
      setSuggestions([]);
      return;
    }
  }

  function handleInput(e) {
    const value = e.target.value;
    setQuery(value);

    ApiClient.searchTags(value)
      .then(tagSuggestions => {
        const existingTagIds = tags.map(tag => tag.tagId);
        const filteredTags = tagSuggestions.filter(tag => !existingTagIds.includes(tag.tagId));
        const hasExactInputInFilteredTags = filteredTags.some(tag => tag.name.toLowerCase() === value.trim().toLowerCase());

        // Showing "Add" even if there are other suggestions since a new tag can be a substring of an existing tag
        if (canCreateTag && value.trim() !== "" && !hasExactInputInFilteredTags) {
          filteredTags.push({ tagId: -1, name: `Add "${value}"` });
        }

        setSuggestions(filteredTags);
        setSelectedTag(filteredTags[0]);
      });
  }

  function handleSuggestionClick(tag) {
    onAddTag(tag);
    closeSuggestions();
  }

  function handleAddNewTagClick() {
    onAddTag({ tagId: -1, name: query });
    closeSuggestions();
  }

  function closeSuggestions(e) {
    setSuggestions([]);
    setQuery("");
    setSelectedTag(null);
  }

  let tagSearch = null;
  const tagItems = tags?.map(tag => <TagItem key={tag.tagId} isEditable={isEditable} tag={tag} onRemoveTag={() => onRemoveTag(tag)} />);

  const suggestionItems = suggestions.map(suggestion => {
    const isSelected = suggestion.tagId === selectedTag?.tagId;
    const className = isSelected ? 'dropdown-option is-selected' : 'dropdown-option';
    const handleClick = suggestion.tagId === -1 ? handleAddNewTagClick : handleSuggestionClick;
    return (
      <li key={suggestion.tagId} onClick={() => handleClick(suggestion)} className={className}>
        <span>{suggestion.name}</span>
      </li>
    );
  });

  if (isEditable) {
    tagSearch = (
      <Fragment>
        <input
          className="notes-editor-tags-input"
          placeholder="Add Tags..."
          autoComplete="off"
          value={query}
          onKeyUp={handleKeyUp}
          onInput={handleInput}
        />
        <div ref={dropdownRef} className={`dropdown-container ${suggestions.length ? 'is-open' : ''}`}>
          <ul className="dropdown-menu">
            {suggestionItems}
          </ul>
        </div>
      </Fragment>
    )
  } else {
    tagSearch = null;
  }

  return (
    <div className="notes-editor-tags">
      {tagItems}
      {tagSearch}
    </div>
  );
}

function TagItem({ tag, isEditable, onRemoveTag }) {
  if (isEditable) {
    return (
      <div className="tag" key={tag.tagId}>
        {tag.name}
        <RemoveIcon onClick={onRemoveTag} />
      </div>
    );
  }

  return (
    <Link className="tag" key={tag.tagId} to={`/notes/?tagId=${tag.tagId}`} shouldPreserveSearchParams>
      {tag.name}
    </Link>
  );
}