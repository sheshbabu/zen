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
    }, 500);
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

function calculatePosition(element, tooltip) {
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    const spacing = 8;
    const arrowSize = 0;

    const positions = [
        {
            placement: 'top',
            left: elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2),
            top: elementRect.top - tooltipRect.height - spacing - arrowSize
        },
        {
            placement: 'bottom',
            left: elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2),
            top: elementRect.bottom + spacing + arrowSize
        },
        {
            placement: 'left',
            left: elementRect.left - tooltipRect.width - spacing - arrowSize,
            top: elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2)
        },
        {
            placement: 'right',
            left: elementRect.right + spacing + arrowSize,
            top: elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2)
        }
    ];

    for (let position of positions) {
        if (isPositionValid(position, tooltipRect, viewport)) {
            return constrainToViewport(position, tooltipRect, viewport);
        }
    }

    return constrainToViewport(positions[0], tooltipRect, viewport);
}

function isPositionValid(position, tooltipRect, viewport) {
    return (
        position.left >= 0 &&
        position.top >= 0 &&
        position.left + tooltipRect.width <= viewport.width &&
        position.top + tooltipRect.height <= viewport.height
    );
}

function constrainToViewport(position, tooltipRect, viewport) {
    const padding = 8;

    position.left = Math.max(padding, Math.min(
        position.left,
        viewport.width - tooltipRect.width - padding
    ));

    position.top = Math.max(padding, Math.min(
        position.top,
        viewport.height - tooltipRect.height - padding
    ));

    return position;
}

function init() {
    addGlobalEventListeners();
    observeElements();
}

export default {
    init
}