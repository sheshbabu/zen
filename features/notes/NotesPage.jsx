import { h, Fragment, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import SidePanel from '../../commons/components/SidePanel.jsx';
import NotesList from './NotesList.jsx';
import NotesEditor from './NotesEditor.jsx';
import BulkActionsPanel from './BulkActionsPanel.jsx';
import BulkActionsToolbar from './BulkActionsToolbar.jsx';
import MobileNavbar from '../../commons/components/MobileNavbar.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import isMobile from "../../commons/utils/isMobile.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";
import { useAppContext } from "../../commons/contexts/AppContext.jsx";
import { NotesProvider, useNotes } from "../../commons/contexts/NotesContext.jsx";
import { LayoutProvider, useLayout } from "../../commons/contexts/LayoutContext.jsx";
import ViewPreferences from "../../commons/preferences/ViewPreferences.js";
import NotesEditorModal from "./NotesEditorModal.jsx";
import { AppProvider } from "../../commons/contexts/AppContext.jsx";
import { openModal } from "../../commons/components/Modal.jsx";

export default function NotesPage({ noteId }) {
  return (
    <NotesProvider>
      <LayoutProvider>
        <NotesPageContent noteId={noteId} />
      </LayoutProvider>
    </NotesProvider>
  );
}

function NotesPageContent({ noteId }) {
  const { isEditorExpanded } = useLayout();
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const { refreshTags } = useAppContext();
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
    // Reset to avoid showing incorrect notes
    resetPagination();

    refreshTags(selectedFocusId);

    // Reload preference
    const savedView = ViewPreferences.getPreference(selectedFocusId, selectedTagId, isArchivesPage, isTrashPage);
    setSelectedView(savedView);
  }, [selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, resetPagination, refreshTags]);

  useEffect(() => {
    refreshNotes(selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, notesPageNumber);
  }, [notesPageNumber, selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, refreshNotes]);

  useEffect(() => {
    refreshImages(selectedTagId, selectedFocusId, imagesPageNumber);
  }, [imagesPageNumber, selectedTagId, selectedFocusId, refreshImages]);

  // TODO: Move this to NotesEditor
  useEffect(() => {
    if (noteId === "new") {
      if (!isMobile() && (selectedView === "card" || selectedView === "gallery")) {
        openModal(
          <AppProvider>
            <NotesProvider>
              <NotesEditorModal isNewNote />
            </NotesProvider>
          </AppProvider>,
          '.note-modal-root'
        );
        window.history.back();
        return;
      }
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

  function handleMultiSelectStart(noteId) {
    setIsMultiSelect(true);
    setSelectedIds([noteId]);
  }

  function handleToggleSelect(noteId) {
    const isSelected = selectedIds.includes(noteId);
    if (isSelected === true) {
      const next = selectedIds.filter(id => id !== noteId);
      setSelectedIds(next);
      if (next.length === 0) {
        setIsMultiSelect(false);
      }
    } else {
      setSelectedIds([...selectedIds, noteId]);
    }
  }

  function handleClearSelection() {
    setIsMultiSelect(false);
    setSelectedIds([]);
  }

  const isEditorExpandable = selectedView === "list";
  const isPageExpanded = isEditorExpanded === true && isEditorExpandable === true;

  let editorContent = <NotesEditor isNewNote={noteId === "new"} isExpandable={isEditorExpandable} key={selectedNote?.noteId} />;
  if (isMultiSelect === true) {
    editorContent = <BulkActionsPanel selectedIds={selectedIds} allIds={notes.map(n => n.noteId)} onClose={handleClearSelection} onSelectAll={() => setSelectedIds(notes.map(n => n.noteId))} />;
  }

  let bulkToolbar = null;
  if (isMultiSelect === true) {
    bulkToolbar = <BulkActionsToolbar selectedIds={selectedIds} allIds={notes.map(n => n.noteId)} onClose={handleClearSelection} onSelectAll={() => setSelectedIds(notes.map(n => n.noteId))} />;
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
    <>
      <div className={`page-container${isPageExpanded ? " is-editor-expanded" : ""}`}>
        <Sidebar />

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
            isMultiSelect={isMultiSelect}
            selectedIds={selectedIds}
            onMultiSelectStart={handleMultiSelectStart}
            onToggleSelect={handleToggleSelect}
          />
        </div>

        <div className={`${editorClassName}${isPageExpanded ? " is-expanded" : ""}`}>
          {editorContent}
        </div>

        <SidePanel />

        <MobileNavbar />
        <div className="note-modal-root"></div>
        <div className="modal-root"></div>
        <div className="toast-root"></div>
        <div className="toc-root"></div>
      </div>

      {bulkToolbar}
    </>
  );
}
