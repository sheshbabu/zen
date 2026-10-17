import { useState, useEffect } from "../../assets/preact.esm.js";
import { splitHighlights, getMatchedTerms } from "./highlights.js";

const HIGHLIGHT_CLASS = "find-match";
const CURRENT_CLASS = "is-current";

export default function useMatchHighlighter({ containerRef, noteId, displayedContent, highlightedText }) {
  const [marks, setMarks] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    setMarks([]);
    setCurrentMatchIndex(0);

    const contentElement = containerRef.current?.querySelector(".search-preview-content");
    if (contentElement === null || contentElement === undefined) {
      return;
    }

    clearHighlights(contentElement);
    const terms = getMatchedTerms(splitHighlights(highlightedText));
    const newMarks = highlightMatches(contentElement, terms);
    setMarks(newMarks);

    if (newMarks.length > 0) {
      setCurrentMatch(newMarks, 0, containerRef.current);
    }
  }, [noteId, displayedContent, highlightedText]);

  function goToMatch(index) {
    if (marks.length === 0) {
      return;
    }
    const wrappedIndex = (index + marks.length) % marks.length;
    setCurrentMatchIndex(wrappedIndex);
    setCurrentMatch(marks, wrappedIndex, containerRef.current);
  }

  function goToNextMatch() {
    goToMatch(currentMatchIndex + 1);
  }

  function goToPreviousMatch() {
    goToMatch(currentMatchIndex - 1);
  }

  return { matchCount: marks.length, currentMatchIndex, goToNextMatch, goToPreviousMatch };
}

function highlightMatches(rootElement, terms) {
  // An empty pattern would match at every position
  if (terms.length === 0) {
    return [];
  }

  const pattern = buildPattern(terms);
  const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  const marks = [];
  for (const textNode of textNodes) {
    const text = textNode.textContent;
    const matches = [...text.matchAll(pattern)];
    if (matches.length === 0) {
      continue;
    }

    const fragment = document.createDocumentFragment();
    let position = 0;
    for (const match of matches) {
      if (match.index > position) {
        fragment.appendChild(document.createTextNode(text.slice(position, match.index)));
      }
      const mark = document.createElement("mark");
      mark.className = HIGHLIGHT_CLASS;
      mark.textContent = match[0];
      fragment.appendChild(mark);
      marks.push(mark);
      position = match.index + match[0].length;
    }
    if (position < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(position)));
    }
    textNode.parentNode.replaceChild(fragment, textNode);
  }
  return marks;
}

function clearHighlights(rootElement) {
  const marks = rootElement.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`);
  for (const mark of marks) {
    mark.replaceWith(document.createTextNode(mark.textContent));
  }
  rootElement.normalize();
}

function setCurrentMatch(marks, index, scrollContainer) {
  for (const mark of marks) {
    mark.classList.remove(CURRENT_CLASS);
  }
  const mark = marks[index];
  if (mark === undefined) {
    return;
  }
  mark.classList.add(CURRENT_CLASS);

  const containerRect = scrollContainer.getBoundingClientRect();
  const markRect = mark.getBoundingClientRect();
  const offsetWithinContainer = markRect.top - containerRect.top;
  scrollContainer.scrollTop += offsetWithinContainer - scrollContainer.clientHeight / 2 + markRect.height / 2;
}

function buildPattern(terms) {
  const escapedTerms = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(escapedTerms.join("|"), "gi");
}
