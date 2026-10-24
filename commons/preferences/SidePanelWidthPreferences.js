const SIDEPANEL_WIDTH_KEY = 'sidepanel-width';
const MIN_WIDTH = 280;
const MAX_WIDTH = 800;
// Matches the panel's max-width in SidePanel.css, so dragging past it doesn't store a width the panel can't show.
const MAX_WINDOW_FRACTION = 0.4;

function getWidth() {
  try {
    const value = localStorage.getItem(SIDEPANEL_WIDTH_KEY);
    if (value === null) {
      return null;
    }
    return Number(value);
  } catch {
    return null;
  }
}

function setWidth(width) {
  try {
    localStorage.setItem(SIDEPANEL_WIDTH_KEY, String(width));
  } catch {
  }
}

function applyWidth(width) {
  const maxWidth = Math.min(MAX_WIDTH, Math.floor(window.innerWidth * MAX_WINDOW_FRACTION));
  const clampedWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, width));
  document.documentElement.style.setProperty('--sidepanel-width', `${clampedWidth}px`);
  return clampedWidth;
}

function applySavedWidth() {
  const savedWidth = getWidth();
  if (savedWidth !== null) {
    applyWidth(savedWidth);
  }
}

export default {
  setWidth,
  applyWidth,
  applySavedWidth
};
