import { h, render } from './dependencies/preact.esm.js';
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import NotesPage from './commons/components/NotesPage.jsx';
import navigateTo from './commons/utils/navigateTo.js';

document.addEventListener('DOMContentLoaded', () => {
  render(
    <App />,
    document.body
  );
});

document.addEventListener("keyup", e => {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    navigateTo("/new");
    return;
  }
});

function App() {
  return (
    <Router>
      <Route path="/" component={NotesPage} />
      <Route path="/:noteId" component={NotesPage} />
    </Router>
  );
}

