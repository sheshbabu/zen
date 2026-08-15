import { h, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import { SearchIcon, NoteIcon, ArchiveIcon, TrashIcon, TagIcon, PanelRightIcon } from "../../commons/components/Icon.jsx";
import { ModalBackdrop, ModalContainer, closeModal, openModal } from "../../commons/components/Modal.jsx";
import Lightbox from "../../commons/components/Lightbox.jsx";
import SearchHistory from "../../commons/preferences/SearchHistory.js";
import SearchPreviewPreferences from "../../commons/preferences/SearchPreviewPreferences.js";
import Tabs from "../../commons/components/Tabs.jsx";
import SearchPreview from "./SearchPreview.jsx";
import SearchSortDropdown, { SORT_OPTIONS } from "./SearchSortDropdown.jsx";
import "./SearchMenu.css";

export default function SearchMenu() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ lexical_notes: [], semantic_notes: [], semantic_images: [], tags: [] });
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isPreviewVisible, setIsPreviewVisible] = useState(SearchPreviewPreferences.isVisible());
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0].value);

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isPointerActiveRef = useRef(false);

  function handleCloseModal() {
    closeModal();
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setSearchHistory(SearchHistory.getItems());
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim() === "") {
      setResults({ lexical_notes: [], semantic_notes: [], semantic_images: [], tags: [] });
      setSelectedItem(searchHistory.length > 0 ? searchHistory[0] : null);
      setHasSearched(false);
      return;
    }

    setHasSearched(false);

    debounceTimerRef.current = setTimeout(() => {
      runSearch(value, activeSort);
    }, 200);
  }

  function runSearch(value, sort) {
    ApiClient.search(value, sort)
      .then(searchResults => {
        setResults(searchResults);
        setHasSearched(true);
        const allItems = [...searchResults.lexical_notes, ...searchResults.semantic_notes, ...searchResults.semantic_images, ...searchResults.tags];
        if (allItems.length > 0) {
          setSelectedItem(allItems[0]);
        }
      });
  }

  function handleSortChange(sort) {
    setActiveSort(sort);

    if (query.trim() !== "") {
      runSearch(query, sort);
    }

    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      setActiveTab(prev => {
        if (prev === "all") return "notes";
        if (prev === "notes") return "tags";
        return "all";
      });
    }
  }

  function handleKeyUp(e) {
    if (e.key === "Tab") {
      return;
    }

    const isHistoryMode = query.trim() === "";

    let allItems = [];
    if (isHistoryMode === true) {
      allItems = searchHistory;
    } else if (activeTab === "all") {
      allItems = [...results.lexical_notes, ...results.semantic_notes, ...results.semantic_images, ...results.tags];
    } else if (activeTab === "notes") {
      allItems = [...results.lexical_notes, ...results.semantic_notes, ...results.semantic_images];
    } else {
      allItems = results.tags;
    }

    if (e.key === "ArrowDown") {
      isPointerActiveRef.current = false;
      const nextIndex = allItems.indexOf(selectedItem) + 1;
      if (nextIndex < allItems.length) {
        setSelectedItem(allItems[nextIndex]);
      } else {
        setSelectedItem(allItems[0]);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      isPointerActiveRef.current = false;
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


  function handleTogglePreviewClick() {
    const nextIsVisible = isPreviewVisible !== true;
    setIsPreviewVisible(nextIsVisible);
    SearchPreviewPreferences.setVisible(nextIsVisible);

    // Keep keyboard navigation working after clicking the toggle
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }

  function handleResultsMouseMove() {
    isPointerActiveRef.current = true;
  }

  function handleResultMouseEnter(item) {
    if (isPointerActiveRef.current !== true) {
      return;
    }
    setSelectedItem(item);
  }

  function handleResultClick(item) {
    if (item.noteId) {
      SearchHistory.saveItem(item);
      navigateTo(`/notes/${item.noteId}`);
      closeModal();
    } else if (item.tagId) {
      SearchHistory.saveItem(item);
      navigateTo(`/?tagId=${item.tagId}`);
      closeModal();
    } else if (item.filename) {
      const imageDetails = results.semantic_images.map(image => ({
        url: `/images/${image.filename}`,
        width: image.width,
        height: image.height,
        aspectRatio: image.aspectRatio,
        filename: image.filename,
      }));

      const selectedImage = imageDetails.find(img => img.filename === item.filename);

      openModal(<Lightbox selectedImage={selectedImage} imageDetails={imageDetails} onClose={closeModal} />);
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
        <SearchResultItem key={`history-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} onMouseEnter={() => handleResultMouseEnter(item)} />
      )
    });

    historySection = (
      <div className="search-section">
        <h4 className="search-section-title">Recent</h4>
        {historyItems}
      </div>
    );
  } else {
    const showNotes = activeTab === "all" || activeTab === "notes";
    const showTags = activeTab === "all" || activeTab === "tags";

    if (showNotes === true) {
      if (results.lexical_notes.length > 0) {
        const noteItems = results.lexical_notes.map((item, index) => {
          const isSelected = item.noteId === selectedItem?.noteId;
          return (
            <SearchResultItem key={`lexical-note-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} onMouseEnter={() => handleResultMouseEnter(item)} />
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
            <SearchResultItem key={`semantic-note-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} onMouseEnter={() => handleResultMouseEnter(item)} />
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
            <SearchResultImages items={results.semantic_images} onClick={handleResultClick} onMouseEnter={handleResultMouseEnter} />
          </div>
        );
      }
    }

    if (showTags === true) {
      if (results.tags.length > 0) {
        const tagItems = results.tags.map((item, index) => {
          const isSelected = item.tagId === selectedItem?.tagId;
          return (
            <SearchResultItem key={`tag-${index}`} item={item} isSelected={isSelected} onClick={() => handleResultClick(item)} onMouseEnter={() => handleResultMouseEnter(item)} />
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
  }

  let emptySection = null;
  const hasVisibleResults = lexicalNotesSection !== null || semanticNotesSection !== null || semanticImagesSection !== null || tagsSection !== null;

  if (query.trim() !== "" && hasSearched === true && hasVisibleResults === false) {
    emptySection = (
      <div className="search-empty">
        No results for "{query}"
      </div>
    );
  }

  // Only lexical results from the current search carry full content. History items are
  // localStorage snapshots that may be stale, so they must be refetched by the preview.
  const hasInlineContent = results.lexical_notes.includes(selectedItem);

  let previewSection = null;
  if (isPreviewVisible === true) {
    previewSection = <SearchPreview item={selectedItem} hasInlineContent={hasInlineContent} />;
  }

  const showTabs = query.trim() !== "";

  let tabsSection = null;
  if (showTabs === true) {
    // Sort only reorders the Notes section, so hide it when only tags are shown
    let sortSection = null;
    if (activeTab !== "tags") {
      sortSection = <SearchSortDropdown activeSort={activeSort} onSortChange={handleSortChange} />;
    }

    tabsSection = (
      <div className="search-tabs">
        <Tabs
          tabs={[{ value: "all", label: "All" }, { value: "notes", label: "Notes" }, { value: "tags", label: "Tags" }]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {sortSection}
      </div>
    );
  }

  return (
    <ModalBackdrop onClose={handleCloseModal} isCentered={false}>
      <ModalContainer className="search-modal">
        <div className="search-input-container">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search..."
            spellCheck="false"
            ref={inputRef}
            value={query}
            onInput={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
          />
          <button className={`search-preview-toggle ${isPreviewVisible === true ? "is-active" : ""}`} onClick={handleTogglePreviewClick}>
            <PanelRightIcon />
          </button>
        </div>
        {tabsSection}
        <div className={`search-modal-body ${isPreviewVisible === true ? "has-preview" : ""}`}>
          <div className="search-results-container" onMouseMove={handleResultsMouseMove}>
            {historySection}
            {lexicalNotesSection}
            {semanticNotesSection}
            {semanticImagesSection}
            {tagsSection}
            {emptySection}
          </div>
          {previewSection}
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}

function SearchResultItem({ item, isSelected, onClick, onMouseEnter }) {
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
    <div className={`search-result-item ${isSelected ? "is-selected" : ""}`} onClick={onClick} onMouseEnter={onMouseEnter}>
      {icon}
      <div className="search-result-item-content">
        <p className="title" dangerouslySetInnerHTML={{ __html: displayTitle }}></p>
        <p className="subtitle" dangerouslySetInnerHTML={{ __html: displaySubtitle }}></p>
      </div>
    </div>
  );
}

function SearchResultImages({ items, onClick, onMouseEnter }) {
  const images = items.map(item => <img src={`/images/${item.filename}`} key={item.filename} alt={item.description} onClick={() => onClick(item)} onMouseEnter={() => onMouseEnter(item)} />)

  return (
    <div className="search-result-images">
      {images}
    </div>
  );
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