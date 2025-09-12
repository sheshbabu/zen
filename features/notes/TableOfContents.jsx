import { h, render, useRef } from "../../assets/preact.esm.js"
import "./TableOfContents.css";

export default function TableOfContents({ content, isExpanded, isEditable, isNewNote }) {
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
    const modalRoot = document.querySelector('.modal-root');
    if (modalRoot) {
      render(<TableOfContentsPopover headings={headings} onMouseEnter={handlePopoverMouseEnter} onMouseLeave={handlePopoverMouseLeave} />, modalRoot);
    }
  }

  function hidePopover() {
    const modalRoot = document.querySelector('.modal-root');
    if (modalRoot) {
      render(null, modalRoot);
    }
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

  const bars = headings.map((item, index) => (
    <div key={`${item.level}-${index}`} className={`toc-bar toc-bar-level-${item.level}`} />
  ));

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

function TableOfContentsPopover({ headings, onMouseEnter, onMouseLeave }) {
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

    const modalRoot = document.querySelector('.modal-root');
    if (modalRoot) {
      render(null, modalRoot);
    }
  }

  const minLevel = Math.min(...headings.map(h => h.level));

  const items = headings.map((heading, index) => (
    <div key={`${heading.level}-${index}`} className="toc-item" style={{ marginLeft: `${(heading.level - minLevel) * 8}px` }} onClick={() => handleItemClick(heading)} >
      {heading.text}
    </div>
  ));

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
      headings.push({ text, level });
    }
  });

  return headings;
}