import { h, Fragment, useState } from '../../dependencies/preact.esm.js';
import ApiClient from '../http/ApiClient.js';

export default function NotesEditorTags({ tags, isEditable, onAddTag, onRemoveTag }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  function handleKeyUp(e) {
    const value = e.target.value; // setState is async
    setQuery(value);

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
      if (selectedTag.tag_id === -1) {
        onAddTag({ tag_id: -1, name: value });
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
      const lastTag = tags[tags.length - 1];
      if (lastTag) {
        onRemoveTag(lastTag);
      }
      closeSuggestions(e);
      return;
    }

    if (value === "") {
      setSuggestions([]);
      return;
    }

    ApiClient.searchTags(value)
      .then(tagSuggestions => {
        const existingTagIds = tags.map(tag => tag.tag_id);
        const filteredTags = tagSuggestions.filter(tag => !existingTagIds.includes(tag.tag_id));

        if (tagSuggestions.length === 0 && value.trim() !== "") {
          filteredTags.push({ tag_id: -1, name: `Add "${value}"` });
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
    onAddTag({ tag_id: -1, name: query });
    closeSuggestions();
  }

  function closeSuggestions(e) {
    setSuggestions([]);
    setQuery("");
    setSelectedTag(null);
  }

  const tagItems = tags?.map(tag => <TagItem key={tag.tag_id} tag={tag} onRemoveTag={() => onRemoveTag(tag)} />);

  return (
    <div className="notes-editor-tags">
      {tagItems}
      <TagSearch
        query={query}
        isEditable={isEditable}
        suggestions={suggestions}
        selectedTag={selectedTag}
        onKeyUp={handleKeyUp}
        onSuggestionClick={handleSuggestionClick}
        onAddNewTagClick={handleAddNewTagClick}
      />
    </div>
  );
}

function TagItem({ tag, onRemoveTag }) {
  return (
    <div className="tag" key={tag.tag_id}>
      {tag.name}
      <RemoveIcon onClick={onRemoveTag} />
    </div>
  );
}

function TagSearch({ query, isEditable, suggestions, selectedTag, onKeyUp, onSuggestionClick, onAddNewTagClick }) {
  if (!isEditable) {
    return null;
  }

  const suggestionItems = suggestions.map(suggestion => {
    const isSelected = suggestion.tag_id === selectedTag?.tag_id;
    const className = isSelected ? 'dropdown-option is-selected' : 'dropdown-option';
    const handleClick = suggestion.tag_id === -1 ? onAddNewTagClick : onSuggestionClick;
    return (
      <li key={suggestion.tag_id} onClick={() => handleClick(suggestion)} className={className}>
        <span>{suggestion.name}</span>
      </li>
    );
  });

  return (
    <Fragment>
      <input
        className="notes-editor-tags-input"
        placeholder="Add Tags..."
        autoComplete="off"
        value={query}
        onKeyUp={onKeyUp}
      />
      <div className={`dropdown-container ${suggestions.length ? 'open' : ''}`}>
        <ul className="dropdown-menu">
          {suggestionItems}
        </ul>
      </div>
    </Fragment>
  )
}

function RemoveIcon({ onClick }) {
  return (
    <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-minus">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  );
}

