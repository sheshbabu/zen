const SEARCH_PREVIEW_KEY = 'search-preview-visible';

function isVisible() {
  try {
    const value = localStorage.getItem(SEARCH_PREVIEW_KEY);
    if (value === null) {
      return true;
    }
    return value === 'true';
  } catch {
    return true;
  }
}

function setVisible(isPreviewVisible) {
  try {
    localStorage.setItem(SEARCH_PREVIEW_KEY, String(isPreviewVisible));
  } catch {
  }
}

export default {
  isVisible,
  setVisible
};
