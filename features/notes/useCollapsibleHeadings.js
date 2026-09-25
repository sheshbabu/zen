import { useLayoutEffect } from "../../assets/preact.esm.js";
import FoldedHeadingsPreferences from "../../commons/preferences/FoldedHeadingsPreferences.js";

const MAX_FOLDABLE_LEVEL = 3;

export function useCollapsibleHeadings(contentRef, noteId) {
  // Runs after every render because the rendered HTML is replaced whenever content changes or the view remounts.
  // A layout effect applies folds before paint, so folded sections don't flash open.
  useLayoutEffect(() => {
    applyFolds(contentRef.current, noteId);
  });

  function handleHeadingClick(e) {
    const container = contentRef.current;
    const heading = e.target.closest("h1, h2, h3");
    if (container === null || heading === null || heading.parentElement !== container) {
      return false;
    }

    if (e.target.closest("a") !== null || window.getSelection().isCollapsed === false) {
      return false;
    }

    const headingKey = getHeadingKey(heading);
    const currentHeadingKeys = getFoldableHeadings(container).map(getHeadingKey);
    // Dropping keys for headings that no longer exist keeps renamed headings from lingering in storage.
    const foldedHeadingKeys = FoldedHeadingsPreferences.getFoldedHeadings(noteId).filter(key => key !== headingKey && currentHeadingKeys.includes(key));
    if (heading.classList.contains("is-folded") === false) {
      foldedHeadingKeys.push(headingKey);
    }

    FoldedHeadingsPreferences.setFoldedHeadings(noteId, foldedHeadingKeys);
    applyFolds(container, noteId);
    return true;
  }

  return { handleHeadingClick };
}

export function unfoldToHeading(container, heading, noteId) {
  const ancestorKeys = [];
  let level = getHeadingLevel(heading);
  let element = heading.previousElementSibling;

  while (element !== null && level > 1) {
    const elementLevel = getHeadingLevel(element);
    if (elementLevel !== null && elementLevel < level) {
      ancestorKeys.push(getHeadingKey(element));
      level = elementLevel;
    }
    element = element.previousElementSibling;
  }

  const foldedHeadingKeys = FoldedHeadingsPreferences.getFoldedHeadings(noteId).filter(key => ancestorKeys.includes(key) === false);
  FoldedHeadingsPreferences.setFoldedHeadings(noteId, foldedHeadingKeys);
  applyFolds(container, noteId);
}

function applyFolds(container, noteId) {
  if (container === null || noteId === undefined) {
    return;
  }

  const foldedHeadingKeys = FoldedHeadingsPreferences.getFoldedHeadings(noteId);
  let foldLevel = null;

  for (const element of container.children) {
    const level = getHeadingLevel(element);
    if (level !== null && foldLevel !== null && level <= foldLevel) {
      foldLevel = null;
    }

    element.hidden = foldLevel !== null;

    const isFolded = foldLevel === null && level !== null && level <= MAX_FOLDABLE_LEVEL && foldedHeadingKeys.includes(getHeadingKey(element));
    element.classList.toggle("is-folded", isFolded);
    if (isFolded === true) {
      foldLevel = level;
    }
  }
}

function getFoldableHeadings(container) {
  return Array.from(container.children).filter(element => {
    const level = getHeadingLevel(element);
    return level !== null && level <= MAX_FOLDABLE_LEVEL;
  });
}

function getHeadingLevel(element) {
  const match = element.tagName.match(/^H([1-6])$/);
  return match === null ? null : parseInt(match[1], 10);
}

function getHeadingKey(heading) {
  return `${heading.tagName}:${heading.textContent.trim()}`;
}
