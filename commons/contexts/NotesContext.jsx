import { h, createContext, useContext, useState, useCallback } from '../../assets/preact.esm.js';
import ApiClient from '../../commons/http/ApiClient.js';
import useSearchParams from "../../commons/components/useSearchParams.jsx";
import { useAppContext } from './AppContext.jsx';

const NotesContext = createContext();

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notesTotal, setNotesTotal] = useState(0);
  const [notesPageNumber, setNotesPageNumber] = useState(1);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [imagesPageNumber, setImagesPageNumber] = useState(1);
  const [isImagesLoading, setIsImagesLoading] = useState(true);

  const { refreshTags, refreshFocusModes } = useAppContext();

  const searchParams = useSearchParams();
  const selectedTagId = searchParams.get("tagId");
  const selectedFocusId = searchParams.get("focusId");
  const isArchivesPage = searchParams.get("isArchived") === "true";
  const isTrashPage = searchParams.get("isDeleted") === "true";

  const refreshNotes = useCallback((tagId, focusId, isArchived, isDeleted, pageNumber = 1) => {
    setIsNotesLoading(true);

    return ApiClient.getNotes(tagId, focusId, isArchived, isDeleted, pageNumber)
      .then(res => {
        if (pageNumber > 1) {
          setNotes(prevNotes => [...prevNotes, ...res.notes]);
        } else {
          setNotes(res.notes);
        }
        setNotesTotal(res.total);
      })
      .catch(error => {
        console.error('Error loading notes:', error);
      })
      .finally(() => {
        setIsNotesLoading(false);
      });
  }, []);

  const refreshImages = useCallback((tagId, focusId, pageNumber = 1) => {
    setIsImagesLoading(true);

    return ApiClient.getImages(tagId, focusId, pageNumber)
      .then(res => {
        if (pageNumber > 1) {
          setImages(prevImages => [...prevImages, ...res.images]);
        } else {
          setImages(res.images);
        }
        setImagesTotal(res.total);
      })
      .catch(error => {
        console.error('Error loading images:', error);
      })
      .finally(() => {
        setIsImagesLoading(false);
      });
  }, []);

  const handleNoteChange = useCallback(() => {
    refreshNotes(selectedTagId, selectedFocusId, isArchivesPage, isTrashPage);
    refreshImages(selectedTagId, selectedFocusId);
    refreshTags(selectedFocusId);
    refreshFocusModes();
  }, [refreshNotes, refreshImages, refreshTags, refreshFocusModes]);

  const handlePinToggle = useCallback((noteId, isPinned) => {
    const apiCall = isPinned ? ApiClient.unpinNote(noteId) : ApiClient.pinNote(noteId);

    return apiCall
      .then(() => {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.noteId === noteId ? { ...note, isPinned: !isPinned } : note
          )
        );
      })
      .catch(error => {
        console.error('Error toggling pin:', error);
      });
  }, []);

  const handleLoadMoreNotes = useCallback(() => {
    setNotesPageNumber(prev => prev + 1);
  }, []);

  const handleLoadMoreImages = useCallback(() => {
    setImagesPageNumber(prev => prev + 1);
  }, []);

  const resetPagination = useCallback(() => {
    setNotesPageNumber(1);
    setNotes([]);
    setImagesPageNumber(1);
    setImages([]);
    setSelectedNote(null);
  }, []);

  return (
    <NotesContext.Provider value={{
      // Notes state
      notes,
      selectedNote,
      setSelectedNote,
      notesTotal,
      notesPageNumber,
      setNotesPageNumber,
      isNotesLoading,

      // Images state  
      images,
      imagesTotal,
      imagesPageNumber,
      setImagesPageNumber,
      isImagesLoading,

      // Functions
      refreshNotes,
      refreshImages,
      handleNoteChange,
      handlePinToggle,
      handleLoadMoreNotes,
      handleLoadMoreImages,
      resetPagination
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}