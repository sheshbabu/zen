import { h, render } from './assets/preact.esm.js';
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import NotesPage from "./features/notes/NotesPage.jsx";
import navigateTo from './commons/utils/navigateTo.js';
import SearchMenu from './features/search/SearchMenu.jsx';

document.addEventListener('DOMContentLoaded', () => {
  render(
    <App />,
    document.body
  );
});

document.addEventListener("keyup", e => {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    navigateTo("/notes/new");
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    render(<SearchMenu />, document.querySelector('.modal-root'));
  }
});

function App() {
  return (
    <Router>
      <Route path="/" component={NotesPage} />
      <Route path="/notes/" component={NotesPage} />
      <Route path="/notes/:noteId" component={NotesPage} />
    </Router>
  );
}

