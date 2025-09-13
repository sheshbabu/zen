import { useState, useEffect } from "../../assets/preact.esm.js";

export function useVisibleHeadings(contentRef, content, isEditable, isExpanded) {
  const [visibleHeadings, setVisibleHeadings] = useState([]);

  useEffect(() => {
    if (isExpanded !== true || isEditable === true || !contentRef.current) {
      setVisibleHeadings([]);
      return;
    }

    const headingElements = contentRef.current.querySelectorAll('h1, h2, h3');
    if (headingElements.length === 0) {
      setVisibleHeadings([]);
      return;
    }

    const visibleHeadingsMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const heading = entry.target;
          const level = heading.tagName.toLowerCase();
          const text = heading.textContent.trim();
          const index = parseInt(heading.dataset.headingIndex);

          if (entry.isIntersecting === true && text !== '' && typeof index === 'number') {
            visibleHeadingsMap.set(heading, { level, text, index });
          } else {
            visibleHeadingsMap.delete(heading);
          }
        });

        const visibleHeadingsArray = Array.from(visibleHeadingsMap.values());
        setVisibleHeadings(visibleHeadingsArray);
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    headingElements.forEach((heading, index) => {
      heading.dataset.headingIndex = index;
      observer.observe(heading);
    });

    return () => {
      observer.disconnect();
    };
  }, [content, isEditable, isExpanded]);

  return visibleHeadings;
}