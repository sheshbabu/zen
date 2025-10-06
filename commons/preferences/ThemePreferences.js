const THEME_PREFERENCE_KEY = 'theme-preference';
const DEFAULT_THEME = 'system';

function getPreference() {
  try {
    return localStorage.getItem(THEME_PREFERENCE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function setPreference(themeId) {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, themeId);
  } catch {
  }
}

function applyTheme() {
  const savedThemeId = getPreference();
  const darkBgColor = "#121212";
  const lightBgColor = "#FFF";

  if (savedThemeId && savedThemeId !== 'system') {
    document.documentElement.setAttribute('data-theme', savedThemeId);
    const themeColor = savedThemeId === 'dark' ? darkBgColor : lightBgColor;
    document.querySelector("meta[name=theme-color]").setAttribute("content", themeColor);
    document.querySelector("meta[name=background-color]").setAttribute("content", themeColor);
  } else {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = prefersDarkScheme.matches ? 'dark' : 'light';
    document.querySelector("meta[name=theme-color]").setAttribute("content", theme === 'dark' ? darkBgColor : lightBgColor);
    document.querySelector("meta[name=background-color]").setAttribute("content", theme === 'dark' ? darkBgColor : lightBgColor);
  }
}

export default {
  getPreference,
  setPreference,
  applyTheme
};
