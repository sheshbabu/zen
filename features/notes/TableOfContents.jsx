import { h, render, useRef } from "../../assets/preact.esm.js"
import { closeModal, openModal } from "../../commons/components/Modal.jsx";
import "./TableOfContents.css";

export default function TableOfContents({ content, isExpanded, isEditable, isNewNote, visibleHeadings = [] }) {
  const headings = extractHeadings(content);
  const hideTimeoutRef = useRef(null);

  if (isExpanded !== true || isEditable === true || isNewNote === true || headings.length === 0) {
    const tocRoot = document.querySelector('.toc-root');
    if (tocRoot) {
      render(null, tocRoot);
    }
    return null;
  }

  function showPopover() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    openModal(<TableOfContentsPopover headings={headings} visibleHeadings={visibleHeadings} onMouseEnter={handlePopoverMouseEnter} onMouseLeave={handlePopoverMouseLeave} />);
  }

  function hidePopover() {
    closeModal();
  }

  function handleMouseEnter() {
    showPopover();
  }

  function handleMouseLeave() {
    hideTimeoutRef.current = setTimeout(() => {
      hidePopover();
    }, 100);
  }

  function handlePopoverMouseEnter() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }

  function handlePopoverMouseLeave() {
    hideTimeoutRef.current = setTimeout(() => {
      hidePopover();
    }, 100);
  }

  function isHeadingVisible(heading) {
    return visibleHeadings.some(visible => visible.index === heading.index);
  }

  const bars = headings.map((item) => {
    const isVisible = isHeadingVisible(item);
    return (
      <div
        key={`heading-${item.index}`}
        className={`toc-bar toc-bar-level-${item.level} ${isVisible ? 'is-visible' : ''}`}
      />
    );
  });

  const sidebarElement = (
    <div className="toc-sidebar" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="toc-bars">
        {bars}
      </div>
    </div>
  );

  const tocRoot = document.querySelector('.toc-root');
  if (tocRoot) {
    render(sidebarElement, tocRoot);
  }
  return null;
}

function TableOfContentsPopover({ headings, visibleHeadings = [], onMouseEnter, onMouseLeave }) {
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
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    closeModal();
  }

  const minLevel = Math.min(...headings.map(h => h.level));

  function isHeadingVisible(heading) {
    return visibleHeadings.some(visible => visible.index === heading.index);
  }

  const items = headings.map((heading) => {
    const isVisible = isHeadingVisible(heading);
    return (
      <div
        key={`heading-${heading.index}`}
        className={`toc-item ${isVisible ? 'is-visible' : ''}`}
        style={{ marginLeft: `${(heading.level - minLevel) * 8}px` }}
        onClick={() => handleItemClick(heading)}
      >
        {heading.text}
      </div>
    );
  });

  return (
    <div className="toc-popover" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="toc-popover-content">
        <div className="toc-items">
          {items}
        </div>
      </div>
    </div>
  );
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