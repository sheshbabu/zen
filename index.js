import { h, render } from './assets/preact.esm.js';
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import useAuth from './commons/auth/useAuth.jsx';
import LoadingPage from './commons/components/LoadingPage.jsx';
import NotesPage from "./features/notes/NotesPage.jsx";
import LoginPage from './features/users/LoginPage.jsx';
import navigateTo from './commons/utils/navigateTo.js';
import SearchMenu from './features/search/SearchMenu.jsx';

document.addEventListener('DOMContentLoaded', () => {
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
    <Router>
      <Route path="/" component={NotesPage} />
      <Route path="/notes/" component={NotesPage} />
      <Route path="/notes/:noteId" component={NotesPage} />
    </Router>
  );
}

