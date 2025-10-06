const SEARCH_HISTORY_KEY = 'search-history';
const MAX_HISTORY_ENTRIES = 5;

function getItems() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

function saveItem(item) {
  try {
    let history = getItems();

    const existingIndex = history.findIndex(h =>
      (h.noteId && h.noteId === item.noteId) ||
      (h.tagId && h.tagId === item.tagId)
    );

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    history.unshift(item);

    if (history.length > MAX_HISTORY_ENTRIES) {
      history = history.slice(0, MAX_HISTORY_ENTRIES);
    }

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
  }
}

export default {
  getItems,
  saveItem
};
