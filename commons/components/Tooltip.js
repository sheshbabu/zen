import isMobile from '../utils/isMobile';
import './Tooltip.css';

let activeTooltip = null;
let showTimeout = null;
let hideTimeout = null;

function handleMouseOver(e) {
  const element = e.target.closest('[data-tooltip]');
  if (element) {
    showTooltip(element);
  }
}

function handleMouseOut(e) {
  const element = e.target.closest('[data-tooltip]');
  if (element) {
    hideTooltip();
  }
}

function handleScroll() {
  if (activeTooltip) {
    hideTooltip();
  }
}

function handleResize() {
  if (activeTooltip) {
    hideTooltip();
  }
}

function addGlobalEventListeners() {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleResize);
}

function observeElements() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processNewElements(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function processNewElements(element) {
  if (element.hasAttribute && element.hasAttribute('title')) {
    const title = element.getAttribute('title');
    if (title) {
      element.setAttribute('data-tooltip', title);
      element.removeAttribute('title');
    }
  }

  const elementsWithTitle = element.querySelectorAll ? element.querySelectorAll('[title]') : [];
  elementsWithTitle.forEach((el) => {
    const title = el.getAttribute('title');
    if (title) {
      el.setAttribute('data-tooltip', title);
      el.removeAttribute('title');
    }
  });
}

function showTooltip(element) {
  clearTimeout(hideTimeout);

  showTimeout = setTimeout(() => {
    const tooltipText = element.getAttribute('data-tooltip');
    if (!tooltipText) {
      return;
    }

    hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = tooltipText;
    document.body.appendChild(tooltip);

    const position = calculatePosition(element, tooltip);
    tooltip.style.left = `${position.left}px`;
    tooltip.style.top = `${position.top}px`;
    tooltip.className = `tooltip ${position.placement}`;

    activeTooltip = tooltip;

    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
  }, 100);
}

function hideTooltip() {
  clearTimeout(showTimeout);
  clearTimeout(hideTimeout);

  if (activeTooltip) {
    const tooltip = activeTooltip;
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
    activeTooltip = null;
  }
}

function calculatePosition(anchor, element) {
  const anchorRect = anchor.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spacing = 8;

  const positions = [
    {
      placement: 'top',
      left: anchorRect.left + (anchorRect.width / 2) - (elementRect.width / 2),
      top: anchorRect.top - elementRect.height - spacing
    },
    {
      placement: 'bottom',
      left: anchorRect.left + (anchorRect.width / 2) - (elementRect.width / 2),
      top: anchorRect.bottom + spacing
    },
    {
      placement: 'left',
      left: anchorRect.left - elementRect.width - spacing,
      top: anchorRect.top + (anchorRect.height / 2) - (elementRect.height / 2)
    },
    {
      placement: 'right',
      left: anchorRect.right + spacing,
      top: anchorRect.top + (anchorRect.height / 2) - (elementRect.height / 2)
    }
  ];

  for (let position of positions) {
    if (isPositionValid(position, elementRect, viewportWidth, viewportHeight)) {
      return constrainToViewport(position, elementRect, viewportWidth, viewportHeight);
    }
  }

  return constrainToViewport(positions[0], elementRect, viewportWidth, viewportHeight);
}

function isPositionValid(position, elementRect, viewportWidth, viewportHeight) {
  return (
    position.left >= 0 &&
    position.top >= 0 &&
    position.left + elementRect.width <= viewportWidth &&
    position.top + elementRect.height <= viewportHeight
  );
}

function constrainToViewport(position, elementRect, viewportWidth, viewportHeight) {
  const padding = 8;

  position.left = Math.max(padding, Math.min(
    position.left,
    viewportWidth - elementRect.width - padding
  ));

  position.top = Math.max(padding, Math.min(
    position.top,
    viewportHeight - elementRect.height - padding
  ));

  return position;
}

function init() {
  if (isMobile()) {
    return
  }

  addGlobalEventListeners();
  observeElements();
}

export default {
  init
}