import { h, useState, useEffect, useRef } from "../../assets/preact.esm.js";
import ApiClient from "../../commons/http/ApiClient.js";
import renderMarkdown from "../../commons/utils/renderMarkdown.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import Spinner from "../../commons/components/Spinner.jsx";
import { closeModal } from "../../commons/components/Modal.jsx";
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

  return (
    <div className="search-preview" onClick={handleInternalNoteLinkClick}>
      {previewBody}
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
    <div className="search-preview-content">
      <div className="search-preview-title">{titleText}</div>
      <div className="notes-editor-rendered" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
