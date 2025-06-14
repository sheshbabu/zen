import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import NotesList from './NotesList.jsx';
import NotesEditor from './NotesEditor.jsx';
import MobileNavbar from '../../commons/components/MobileNavbar.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";

export default function NotesPage({ noteId }) {
  const [notes, setNotes] = useState([]);
  const [notesTotal, setNotesTotal] = useState(0);
  const [notesPageNumber, setNotesPageNumber] = useState(1);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [imagesPageNumber, setImagesPageNumber] = useState(1);
  const [isImagesLoading, setIsImagesLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [focusModes, setFocusModes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedView, setSelectedView] = useState("list"); // "list" || "card" || "gallery"

  const searchParams = useSearchParams();
  const selectedTagId = searchParams.get("tagId");
  const selectedFocusId = searchParams.get("focusId");
  const isArchivesPage = searchParams.get("isArchived") === "true";
  const isTrashPage = searchParams.get("isDeleted") === "true";

  const isMobile = window.matchMedia("(max-width: 600px)").matches;

  let listClassName = "notes-list-container";
  let editorClassName = "notes-editor-container";

  useEffect(() => {
    refreshNotes();
    refreshImages();
    refreshTags();
    refreshFocusModes();
  }, []);

  useEffect(() => {
    // Reset to avoid showing incorrect notes
    setNotesPageNumber(1);
    setNotes([]);
    setImagesPageNumber(1);
    setImages([]);
    setSelectedNote(null);

    refreshNotes();
    refreshImages();
    refreshTags();
  }, [selectedTagId, selectedFocusId, isArchivesPage, isTrashPage]);

  useEffect(() => {
    refreshNotes();
  }, [notesPageNumber]);

  useEffect(() => {
    refreshImages();
  }, [imagesPageNumber]);

  // TODO: Move this to NotesEditor
  useEffect(() => {
    if (noteId === "new") {
      setSelectedNote(null);
      return;
    }

    if (noteId === undefined) {
      // Automatically select first note in desktop mode
      if (!isMobile && notes.length > 0) {
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

  function refreshNotes() {
    setIsNotesLoading(true);
    
    ApiClient.getNotes(selectedTagId, selectedFocusId, isArchivesPage, isTrashPage, notesPageNumber)
      .then(res => {
        if (notesPageNumber > 1) {
          setNotes(prevNotes => [...prevNotes, ...res.notes]);
        } else {
          setNotes(res.notes);
        }
        setNotesTotal(res.total);
      })
      .catch(error => {
        console.error('Error loading notes:', error);
      }).finally(() => {
        setIsNotesLoading(false);
      });
  }

  function refreshImages() {
    setIsImagesLoading(true);
    
    ApiClient.getImages(selectedTagId, selectedFocusId, imagesPageNumber)
      .then(res => {
        if (imagesPageNumber > 1) {
          setImages(prevImages => [...prevImages, ...res.images]);
        } else {
          setImages(res.images);
        }
        setImagesTotal(res.total);
      })
      .catch(error => {
        console.error('Error loading images:', error);
      }).finally(() => {
        setIsImagesLoading(false);
      });
  }

  function refreshTags() {
    ApiClient.getTags(selectedFocusId)
      .then(newTags => {
        setTags(newTags);
      })
      .catch(error => {
        console.error('Error loading tags:', error);
      });
  }

  function refreshFocusModes() {
    ApiClient.getFocusModes()
      .then(focusModes => {
        setFocusModes(focusModes);
      })
      .catch(error => {
        console.error('Error loading focus modes:', error);
      });
  }

  // Update notes, tags, and focus modes when a note is created/updated/deleted
  function handleNoteChange() {
    refreshNotes();
    refreshImages();
    refreshTags();
  }

  function handleViewChange(newView) {
    setSelectedView(newView);
  }

  function handleLoadMoreClick() {
    setNotesPageNumber(notesPageNumber + 1);
  }

  function handleLoadMoreImagesClick() {
    setImagesPageNumber(imagesPageNumber + 1);
  }

  if (selectedView === "list") {
    listClassName = "notes-list-container"
    editorClassName = "notes-editor-container";
  } else if (selectedView === "card" || selectedView === "gallery") {
    listClassName = "notes-list-container grid";

    if (noteId === undefined) {
      editorClassName = "notes-editor-container is-hidden";
    } else if (!isMobile) {
      editorClassName = "notes-editor-container is-floating";
    }
  }

  return (
    <div className="page-container">
      <div className="sidebar-container">
        <Sidebar focusModes={focusModes} tags={tags} />
      </div>

      <div className={listClassName} data-page={noteId === undefined ? "notes" : "editor"}>
        <NotesList 
          notes={notes} 
          total={notesTotal} 
          isLoading={isNotesLoading} 
          images={images}
          imagesTotal={imagesTotal}
          isImagesLoading={isImagesLoading}
          view={selectedView} 
          onViewChange={handleViewChange} 
          onLoadMoreClick={handleLoadMoreClick}
          onLoadMoreImagesClick={handleLoadMoreImagesClick}
        />
      </div>

      <div className={editorClassName} data-page={noteId === undefined ? "notes" : "editor"}>
        <NotesEditor selectedNote={selectedNote} isNewNote={noteId === "new"} key={selectedNote?.noteId} isFloating={noteId !== undefined && selectedView !== "list"} onChange={handleNoteChange} />
      </div>

      <MobileNavbar />

      <div className="modal-root"></div>
      <div className="toast-root"></div>
    </div>
  );
}
