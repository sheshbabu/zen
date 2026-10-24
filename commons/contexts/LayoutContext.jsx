import { h, createContext, useContext, useState, useCallback, useEffect } from '../../assets/preact.esm.js';
import isMobile from '../utils/isMobile.js';

const defaultValue = {
  isSidebarOpen: false,
  isEditorExpanded: false,
  sidePanelNoteId: null,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  toggleEditorExpanded: () => {},
  openSidePanelNote: () => {},
  closeSidePanel: () => {},
};

const LayoutContext = createContext(defaultValue);

export function LayoutProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile());
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [sidePanelNoteId, setSidePanelNoteId] = useState(null);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleEditorExpanded = useCallback(() => {
    setIsEditorExpanded(prev => !prev);
  }, []);

  const openSidePanelNote = useCallback(noteId => {
    setSidePanelNoteId(noteId);
  }, []);

  const closeSidePanel = useCallback(() => {
    setSidePanelNoteId(null);
  }, []);

  useEffect(() => {
    function handleNavigationChange() {
      // Defer: a sync setState here races with useSearchParams' setState in a child, and Preact drops one of the updates.
      queueMicrotask(() => {
        setIsSidebarOpen(false);
        setSidePanelNoteId(null);
      });
    }

    // Back/forward doesn't fire 'navigate', and it should close the panel without touching the sidebar.
    function handlePopState() {
      queueMicrotask(() => setSidePanelNoteId(null));
    }

    window.addEventListener('navigate', handleNavigationChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('navigate', handleNavigationChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <LayoutContext.Provider value={{
      isSidebarOpen,
      isEditorExpanded,
      sidePanelNoteId,
      toggleSidebar,
      closeSidebar,
      toggleEditorExpanded,
      openSidePanelNote,
      closeSidePanel,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
