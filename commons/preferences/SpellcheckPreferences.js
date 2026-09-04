const SPELLCHECK_KEY = 'spellcheck-enabled';

function isEnabled() {
  try {
    const value = localStorage.getItem(SPELLCHECK_KEY);
    if (value === null) {
      return false;
    }
    return value === 'true';
  } catch {
    return false;
  }
}

function setEnabled(isSpellcheckEnabled) {
  try {
    localStorage.setItem(SPELLCHECK_KEY, String(isSpellcheckEnabled));
  } catch {
  }
}

export default {
  isEnabled,
  setEnabled
};
