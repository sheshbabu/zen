import { h, createContext, useContext, useState, useCallback, useEffect } from '../../assets/preact.esm.js';
import ApiClient from '../../commons/http/ApiClient.js';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [tags, setTags] = useState([]);
  const [focusModes, setFocusModes] = useState([]);

  const refreshTags = useCallback((focusId) => {
    return ApiClient.getTags(focusId)
      .then(newTags => {
        setTags(newTags);
      })
      .catch(error => {
        console.error('Error loading tags:', error);
      });
  }, []);

  const refreshFocusModes = useCallback(() => {
    return ApiClient.getFocusModes()
      .then(focusModes => {
        setFocusModes(focusModes);
      })
      .catch(error => {
        console.error('Error loading focus modes:', error);
      });
  }, []);

  // Initialize data on mount
  useEffect(() => {
    refreshTags();
    refreshFocusModes();
  }, [refreshTags, refreshFocusModes]);

  return (
    <AppContext.Provider value={{
      tags,
      focusModes,
      refreshTags,
      refreshFocusModes
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}