const AUTO_SAVE_KEY = 'auto-save-enabled';

function isEnabled() {
  try {
    const value = localStorage.getItem(AUTO_SAVE_KEY);
    if (value === null) {
      return false;
    }
    return value === 'true';
  } catch {
    return false;
  }
}

function setEnabled(isAutoSaveEnabled) {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, String(isAutoSaveEnabled));
  } catch {
  }
}

export default {
  isEnabled,
  setEnabled
};
