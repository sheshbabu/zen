import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import NotesList from './NotesList.jsx';
import NotesEditor from './NotesEditor.jsx';
import MobileNavbar from '../../commons/components/MobileNavbar.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import isMobile from "../../commons/utils/isMobile.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";
import { useAppContext } from "../../commons/contexts/AppContext.jsx";
import { NotesProvider, useNotes } from "../../commons/contexts/NotesContext.jsx";
import ViewPreferences from "../../commons/preferences/ViewPreferences.js";

export default function NotesPage({ noteId }) {
  return (
    <NotesProvider>
      <NotesPageContent noteId={noteId} />
    </NotesProvider>
  );
}

function NotesPageContent({ noteId }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(isMobile() ? false : true);

  const { refreshTags, refreshFocusModes } = useAppContext();
  const {
    notes,
    selectedNote,
    setSelectedNote,
    notesTotal,
    notesPageNumber,
    isNotesLoading,
    images,
    imagesTotal,
    imagesPageNumber,
    isImagesLoading,
    refreshNotes,
    refreshImages,
    handleNoteChange,
    handlePinToggle,
    handleLoadMoreNotes,
    handleLoadMoreImages,
    resetPagination
  } = useNotes();

  const searchParams = useSearchParams();
  const selectedTagId = searchParams.get("tagId");
  const selectedFocusId = searchParams.get("focusId");
  const isArchivesPage = searchParams.get("isArchived") === "true";
  const isTrashPage = searchParams.get("isDeleted") === "true";

  const [selectedView, setSelectedView] = useState(() => {
    return ViewPreferences.getPreference(selectedFocusId, selectedTagId, isArchivesPage, isTrashPage);
  });

  let listClassName = "notes-list-container";
  let editorClassName = "notes-editor-container";

  useEffect(() => {
    refreshNotes(selectedTagId, selectedFocusId, isArchivesPage, isTrashPage);
    refreshImages(selectedTagId, selectedFocusId);
    refreshTags(selectedFocusId);
    refreshFocusModes();
  }, [refreshNotes, refreshImages, refreshTags, refreshFocusModes]);

  useEffect(() => {
    // Reset to avoid showing incorrect notes
    resetPagination();

    refreshNotes(selectedTagId, selectedFocusId, isArchivesPage, isTrashPage);
    refreshImages(selectedTagId, selectedFocusId);
    refreshTags(selectedFocusId);

    // Reload preference
    const savedView = ViewPreferences.getPreference(selectedFocusId, selectedTagId, isArchivesPage, isTrashPage);
    setSelectedView(savedView);
  }, [selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, resetPagination, refreshNotes, refreshImages, refreshTags]);

  useEffect(() => {
    refreshNotes(selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, notesPageNumber);
  }, [notesPageNumber, selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, refreshNotes]);

  useEffect(() => {
    refreshImages(selectedTagId, selectedFocusId, imagesPageNumber);
  }, [imagesPageNumber, selectedTagId, selectedFocusId, refreshImages]);

  // TODO: Move this to NotesEditor
  useEffect(() => {
    if (noteId === "new") {
      setSelectedNote(null);
      return;
    }

    if (noteId === undefined) {
      // Automatically select first note in desktop mode
      if (!isMobile() && notes.length > 0) {
        setSelectedNote(notes[0]);
        return;
      }
      setSelectedNote(null);
    }

    if (noteId !== undefined) {
      const selectedNoteId = parseInt(noteId, 10);
      ApiClient.getNoteById(selectedNoteId)
        .then(note => {
          setSelectedNote(note);
        })
        .catch(error => {
          console.error('Error loading note:', error);
        });
    }

  }, [noteId, notes]);

  function handleViewChange(newView) {
    setSelectedView(newView);
    ViewPreferences.setPreference(newView, selectedFocusId, selectedTagId, isArchivesPage, isTrashPage);
  }

  if (selectedView === "list") {
    listClassName = "notes-list-container"
    editorClassName = "notes-editor-container";
  } else if (selectedView === "card" || selectedView === "gallery") {
    listClassName = "notes-list-container grid";
    if (noteId === undefined || !isMobile()) {
      editorClassName = "notes-editor-container is-hidden";
    } else {
      editorClassName = "notes-editor-container";
    }
  }

  if (isMobile()) {
    if (noteId !== undefined) {
      listClassName += " is-hidden";
      editorClassName = editorClassName.replace(" is-hidden", "") + " is-visible";
    } else {
      listClassName += " is-visible";
      editorClassName += " is-hidden";
    }
  }

  return (
    <div className="page-container">
      <Sidebar isOpen={isSidebarOpen} onSidebarClose={() => setIsSidebarOpen(false)} />

      <div className={listClassName}>
        <NotesList
          notes={notes}
          total={notesTotal}
          isLoading={isNotesLoading}
          images={images}
          imagesTotal={imagesTotal}
          isImagesLoading={isImagesLoading}
          view={selectedView}
          onViewChange={handleViewChange}
          onLoadMoreClick={handleLoadMoreNotes}
          onLoadMoreImagesClick={handleLoadMoreImages}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <div className={editorClassName}>
        <NotesEditor isNewNote={noteId === "new"} key={selectedNote?.noteId} />
      </div>

      <MobileNavbar />

      <div className="note-modal-root"></div>
      <div className="modal-root"></div>
      <div className="toast-root"></div>
      <div className="toc-root"></div>
    </div>
  );
}
