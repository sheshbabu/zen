import { h, render } from './assets/preact.esm.js';
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import useAuth from './commons/auth/useAuth.jsx';
import LoadingPage from './commons/components/LoadingPage.jsx';
import NotesPage from "./features/notes/NotesPage.jsx";
import TemplatesPage from "./features/templates/TemplatesPage.jsx";
import LoginPage from './features/users/LoginPage.jsx';
import navigateTo from './commons/utils/navigateTo.js';
import SearchMenu from './features/search/SearchMenu.jsx';
import OfflineIndicator from './commons/components/OfflineIndicator.jsx';
import Tooltip from './commons/components/Tooltip.js';
import { AppProvider } from './commons/contexts/AppContext.jsx';

document.addEventListener('DOMContentLoaded', () => {
  setUserPreferredTheme();
  Tooltip.init();
  render(
    <App />,
    document.body
  );
});

document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    navigateTo("/notes/new");
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    render(<SearchMenu />, document.querySelector('.modal-root'));
  }

  if (e.key === 'Escape') {
    if (document.querySelector('.modal-root').firstChild) {
      e.preventDefault();
      render(null, document.querySelector('.modal-root'));
    }
  }
});

function App() {
  const { isLoading, shouldShowLogin, shouldShowOnboarding } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (shouldShowLogin) {
    return <LoginPage />;
  }

  if (shouldShowOnboarding) {
    return <LoginPage isOnboarding />;
  }

  return (
    <AppProvider>
      <OfflineIndicator />
      <Router>
        <Route path="/" component={NotesPage} />
        <Route path="/notes/" component={NotesPage} />
        <Route path="/notes/:noteId" component={NotesPage} />
        <Route path="/templates/" component={TemplatesPage} />
        <Route path="/templates/:templateId" component={TemplatesPage} />
      </Router>
    </AppProvider>
  );
}

function setUserPreferredTheme() {
  const savedThemeId = localStorage.getItem('theme-preference');
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