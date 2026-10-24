import { useEffect, useRef } from "../../assets/preact.esm.js";
import { useAppContext } from "../../commons/contexts/AppContext.jsx";

export default function useNewNoteTag({ isNewNote, setTags }) {
  const { tags, focusModes } = useAppContext();
  const hasSeededRef = useRef(false);

  // Tags and focus modes load asynchronously, and the new-note modal gets a fresh context, so this waits for them instead of seeding on first render.
  useEffect(() => {
    if (!isNewNote || hasSeededRef.current) {
      return;
    }

    const currentTag = findCurrentTag(tags, focusModes);
    if (currentTag === null) {
      return;
    }

    hasSeededRef.current = true;
    setTags(prevTags => prevTags.length === 0 ? [currentTag] : prevTags);
  }, [isNewNote, tags, focusModes]);
}

function findCurrentTag(tags, focusModes) {
  const searchParams = new URLSearchParams(window.location.search);
  const tagId = searchParams.get("tagId");
  const focusId = searchParams.get("focusId");

  if (tagId !== null) {
    return tags.find(tag => String(tag.tagId) === tagId) || null;
  }

  // A focus mode with several tags gives no way to know which one is meant.
  if (focusId !== null) {
    const focusMode = focusModes.find(mode => String(mode.focusId) === focusId);
    if (focusMode && focusMode.tags.length === 1) {
      return focusMode.tags[0];
    }
  }

  return null;
}
