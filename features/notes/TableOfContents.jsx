import { h, render } from "../../assets/preact.esm.js"
import { unfoldToHeading } from "./useCollapsibleHeadings.js";
import "./TableOfContents.css";

export default function TableOfContents({ noteId, content, isExpanded, isEditable, isNewNote, visibleHeadings = [] }) {
  const headings = extractHeadings(content);

  if (isExpanded !== true || isEditable === true || isNewNote === true || headings.length < 4) {
    const tocRoot = document.querySelector('.toc-root');
    if (tocRoot) {
      render(null, tocRoot);
    }
    return null;
  }

  function handleItemClick(heading) {
    const headingElements = document.querySelectorAll(`h${heading.level}`);
    let targetElement = null;

    for (const element of headingElements) {
      if (element.textContent.trim() === heading.text) {
        targetElement = element;
        break;
      }
    }

    if (targetElement !== null) {
      unfoldToHeading(targetElement.parentElement, targetElement, noteId);
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function isHeadingVisible(heading) {
    return visibleHeadings.some(visible => visible.index === heading.index);
  }

  const minLevel = Math.min(...headings.map(h => h.level));

  const items = headings.map((heading) => {
    const isVisible = isHeadingVisible(heading);
    // Staggers the reveal for the first few rows only, so long lists don't take ages to appear.
    const revealStep = Math.min(heading.index, 4);
    return (
      <div
        key={`heading-${heading.index}`}
        className={`toc-item ${isVisible ? 'is-visible' : ''}`}
        style={{ '--toc-reveal-step': revealStep, '--toc-indent': `${(heading.level - minLevel) * 8}px` }}
        onClick={() => handleItemClick(heading)}
      >
        <span className={`toc-bar toc-bar-level-${heading.level}`}></span>
        <span className="toc-label">{heading.text}</span>
      </div>
    );
  });

  const tocElement = (
    <div className="toc">
      {items}
    </div>
  );

  const tocRoot = document.querySelector('.toc-root');
  if (tocRoot) {
    render(tocElement, tocRoot);
  }
  return null;
}

function extractHeadings(content) {
  if (content === '') {
    return [];
  }

  const headings = [];
  const lines = content.split('\n');
  let isInsideCodeBlock = false;
  let codeBlockMarker = '';
  let headingIndex = 0;

  lines.forEach(line => {
    const trimmedLine = line.trim();

    // Check if we're entering or exiting a code block
    if (trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~')) {
      if (!isInsideCodeBlock) {
        isInsideCodeBlock = true;
        codeBlockMarker = trimmedLine.substring(0, 3);
      } else if (trimmedLine.startsWith(codeBlockMarker)) {
        isInsideCodeBlock = false;
        codeBlockMarker = '';
      }
      return;
    }

    // Skip processing if we're inside a code block
    if (isInsideCodeBlock) {
      return;
    }

    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ text, level, index: headingIndex });
      headingIndex++;
    }
  });

  return headings;
}