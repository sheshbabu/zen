import { h, createContext, useContext, useState, useCallback, useEffect } from '../../assets/preact.esm.js';
import isMobile from '../utils/isMobile.js';

const defaultValue = {
  isSidebarOpen: false,
  isEditorExpanded: false,
  sidePanelContent: null,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  toggleEditorExpanded: () => {},
  setSidePanelContent: () => {},
};

const LayoutContext = createContext(defaultValue);

export function LayoutProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile());
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState(null);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleEditorExpanded = useCallback(() => {
    setIsEditorExpanded(prev => !prev);
  }, []);

  useEffect(() => {
    function handleNavigationChange() {
      // Defer: a sync setState here races with useSearchParams' setState in a child, and Preact drops one of the updates.
      queueMicrotask(() => setIsSidebarOpen(false));
    }

    window.addEventListener('navigate', handleNavigationChange);

    return () => {
      window.removeEventListener('navigate', handleNavigationChange);
    };
  }, []);

  return (
    <LayoutContext.Provider value={{
      isSidebarOpen,
      isEditorExpanded,
      sidePanelContent,
      toggleSidebar,
      closeSidebar,
      toggleEditorExpanded,
      setSidePanelContent,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
