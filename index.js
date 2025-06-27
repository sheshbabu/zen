import { h, render, Fragment } from './assets/preact.esm.js';
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import useAuth from './commons/auth/useAuth.jsx';
import LoadingPage from './commons/components/LoadingPage.jsx';
import NotesPage from "./features/notes/NotesPage.jsx";
import MobileHomePage from './features/notes/MobileHomePage.jsx';
import LoginPage from './features/users/LoginPage.jsx';
import navigateTo from './commons/utils/navigateTo.js';
import SearchMenu from './features/search/SearchMenu.jsx';
import OfflineIndicator from './commons/components/OfflineIndicator.jsx';

document.addEventListener('DOMContentLoaded', () => {
  setUserPreferredTheme();
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
  const isMobile = window.matchMedia("(max-width: 948px)").matches;

  return (
    <>
      <OfflineIndicator />
      <Router>
        <Route path="/" component={isMobile ? MobileHomePage : NotesPage} />
        <Route path="/notes/" component={NotesPage} />
        <Route path="/notes/:noteId" component={NotesPage} />
      </Router>
    </>
  );
}

function setUserPreferredTheme() {
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = prefersDarkScheme.matches ? 'dark' : 'light';
  document.querySelector("meta[name=theme-color]").setAttribute("content", theme === 'dark' ? "#121212" : "#FFF");
  document.querySelector("meta[name=background-color]").setAttribute("content", theme === 'dark' ? "#121212" : "#FFF");
}