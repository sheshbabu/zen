import { h, render } from './assets/preact.esm.js';
import Router from './commons/components/Router.jsx';
import Route from './commons/components/Route.jsx';
import useAuth from './commons/auth/useAuth.jsx';
import LoadingPage from './commons/components/LoadingPage.jsx';
import NotesPage from "./features/notes/NotesPage.jsx";
import TemplatesPage from "./features/templates/TemplatesPage.jsx";
import CanvasPage from "./features/canvas/CanvasPage.jsx";
import CanvasesPage from "./features/canvas/CanvasesPage.jsx";
import LoginPage from './features/users/LoginPage.jsx';
import navigateTo from './commons/utils/navigateTo.js';
import SearchMenu from './features/search/SearchMenu.jsx';
import OfflineIndicator from './commons/components/OfflineIndicator.jsx';
import Tooltip from './commons/components/Tooltip.js';
import { AppProvider } from './commons/contexts/AppContext.jsx';
import ThemePreferences from './commons/preferences/ThemePreferences.js';


// Copy code button functionality
function copyCode(button) {
  const wrapper = button.closest('.code-block-wrapper');
  if (!wrapper) return;
  const pre = wrapper.querySelector('pre');
  if (!pre) return;
  const code = pre.innerText;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      const originalText = button.innerText;
      button.innerText = 'Copied!';
      setTimeout(() => {
        button.innerText = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback to execCommand
      fallbackCopyTextToClipboard(code, button);
    });
  } else {
    // Use fallback method
    fallbackCopyTextToClipboard(code, button);
  }
}

function fallbackCopyTextToClipboard(text, button) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      const originalText = button.innerText;
      button.innerText = 'Copied!';
      setTimeout(() => {
        button.innerText = originalText;
      }, 2000);
    } else {
      console.error('Fallback copy failed');
    }
  } catch (err) {
    console.error('Fallback copy error: ', err);
  }
  document.body.removeChild(textArea);
}
window.copyCode = copyCode;
document.addEventListener('DOMContentLoaded', () => {
  ThemePreferences.applyTheme();
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
        <Route path="/canvases/" component={CanvasesPage} />
        <Route path="/canvases/:canvasId" component={CanvasPage} />
      </Router>
    </AppProvider>
  );
}