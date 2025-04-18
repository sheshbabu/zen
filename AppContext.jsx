import { h, createContext, useState, useContext } from './dependencies/preact.esm.js';

const defaultAppContext = {
  focusModes: [],
  tags: [],
  notes: [],
};

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [appContext, setAppContext] = useState(defaultAppContext);

  const updateAppContext = (newState) => {
    setAppContext(prevState => ({
      ...prevState,
      ...newState
    }));
  };

  return (
    <AppContext.Provider value={{ appContext, updateAppContext }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
