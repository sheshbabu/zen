import { h, useState, useEffect, useRef } from "../../assets/preact.esm.js";
import ApiClient from "../../commons/http/ApiClient.js";
import renderMarkdown from "../../commons/utils/renderMarkdown.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import Spinner from "../../commons/components/Spinner.jsx";
import { ArrowUpIcon, ArrowDownIcon } from "../../commons/components/Icon.jsx";
import { closeModal } from "../../commons/components/Modal.jsx";
import useMatchHighlighter from "./useMatchHighlighter.js";
import "../notes/NotesEditor.css";
import "./SearchPreview.css";

const FETCH_DEBOUNCE_MS = 120;
const MAX_CACHED_NOTES = 30;

export default function SearchPreview({ item, hasInlineContent }) {
  const [fetchedNote, setFetchedNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const noteCacheRef = useRef(new Map());
  const htmlCacheRef = useRef(new Map());
  const previewRef = useRef(null);

  let noteId = null;
  if (item !== null && item !== undefined && item.noteId !== undefined) {
    noteId = item.noteId;
  }

  const canRenderInline = noteId !== null && hasInlineContent === true;
  const shouldFetch = noteId !== null && canRenderInline === false;

  useEffect(() => {
    if (shouldFetch !== true) {
      setFetchedNote(null);
      setIsLoading(false);
      setHasFailed(false);
      return;
    }

    const cachedNote = noteCacheRef.current.get(noteId);
    if (cachedNote !== undefined) {
      setFetchedNote(cachedNote);
      setIsLoading(false);
      setHasFailed(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setHasFailed(false);

    const timerId = setTimeout(() => {
      ApiClient.getNoteById(noteId)
        .then(note => {
          if (isCurrent !== true) {
            return;
          }
          addToCache(noteCacheRef.current, noteId, note);
          setFetchedNote(note);
          setIsLoading(false);
        })
        .catch(() => {
          if (isCurrent !== true) {
            return;
          }
          setFetchedNote(null);
          setHasFailed(true);
          setIsLoading(false);
        });
    }, FETCH_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timerId);
    };
  }, [noteId, shouldFetch]);

  let displayedContent = null;
  let highlightedText = "";
  if (canRenderInline === true) {
    displayedContent = item.content;
    highlightedText = `${item.highlightedTitle}\n${item.highlightedContent}`;
  } else if (fetchedNote !== null) {
    displayedContent = fetchedNote.content;
  }

  const { matchCount, currentMatchIndex, goToNextMatch, goToPreviousMatch } = useMatchHighlighter({
    containerRef: previewRef,
    noteId,
    displayedContent,
    highlightedText,
  });

  function handleStepButtonMouseDown(e) {
    // Keep focus in the search input so keyboard navigation keeps working
    e.preventDefault();
  }

  function handleInternalNoteLinkClick(e) {
    const link = e.target.closest("a[data-note-id]");
    if (link === null) {
      return;
    }
    e.preventDefault();
    const linkedNoteId = parseInt(link.getAttribute("data-note-id"), 10);
    navigateTo(`/notes/${linkedNoteId}`);
    closeModal();
  }

  let previewBody = null;

  if (noteId === null) {
    previewBody = <div className="search-preview-empty">Select a note to preview</div>;
  } else if (canRenderInline === true) {
    previewBody = renderNoteContent(item.title, item.content, htmlCacheRef.current, noteId);
  } else if (isLoading === true) {
    previewBody = (
      <div className="search-preview-empty">
        <Spinner />
      </div>
    );
  } else if (hasFailed === true) {
    previewBody = <div className="search-preview-empty">Note not available</div>;
  } else if (fetchedNote !== null) {
    previewBody = renderNoteContent(fetchedNote.title, fetchedNote.content, htmlCacheRef.current, noteId);
  } else {
    previewBody = <div className="search-preview-empty">Select a note to preview</div>;
  }

  let matchStepper = null;
  if (matchCount > 0) {
    matchStepper = (
      <div className="search-preview-find">
        <span className="search-preview-find-count">{currentMatchIndex + 1} of {matchCount}</span>
        <button type="button" title="Previous match" onMouseDown={handleStepButtonMouseDown} onClick={goToPreviousMatch}>
          <ArrowUpIcon />
        </button>
        <button type="button" title="Next match" onMouseDown={handleStepButtonMouseDown} onClick={goToNextMatch}>
          <ArrowDownIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={`search-preview-wrapper ${matchCount > 0 ? "has-matches" : ""}`}>
      <div className="search-preview" ref={previewRef} onClick={handleInternalNoteLinkClick}>
        {previewBody}
      </div>
      {matchStepper}
    </div>
  );
}

function addToCache(cache, key, value) {
  if (cache.size >= MAX_CACHED_NOTES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, value);
}

function renderNoteContent(title, content, htmlCache, noteId) {
  let titleText = title;
  if (titleText === undefined || titleText === "") {
    titleText = "Untitled";
  }

  const cacheKey = `${noteId}-${content.length}`;
  let html = htmlCache.get(cacheKey);
  if (html === undefined) {
    html = renderMarkdown(content);
    addToCache(htmlCache, cacheKey, html);
  }

  return (
    <div className="search-preview-content" key={noteId}>
      <div className="search-preview-title">{titleText}</div>
      <div className="notes-editor-rendered" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
