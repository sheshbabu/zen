import { h, render, useEffect } from './dependencies/preact.esm.js';
import { AppProvider, useAppContext } from './AppContext.jsx';
import ApiClient from "./commons/http/ApiClient.js";
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import NotesPage from './commons/components/NotesPage.jsx';
import navigateTo from './commons/utils/navigateTo.js';

document.addEventListener('DOMContentLoaded', () => {
  render(
    <AppProvider>
      <App />
    </AppProvider>,
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
  const { updateAppContext } = useAppContext();

  useEffect(() => {
    Promise.all([ApiClient.getAllFocusModes(), ApiClient.getAllTags()])
      .then(([focusModes, tags]) => {
        updateAppContext({ focusModes, tags });
      })
      .catch((error) => {
        console.error('Error loading initial data:', error);
      });
  }, []);

  return (
    <Router>
      <Route path="/" component={NotesPage} />
      <Route path="/:noteId" component={NotesPage} />
    </Router>
  );
}

