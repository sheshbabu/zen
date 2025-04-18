import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import NotesList from './NotesList.jsx';
import NotesEditor from './NotesEditor.jsx';
import MobileNavbar from '../../commons/components/MobileNavbar.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";

export default function NotesPage({ noteId }) {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [focusModes, setFocusModes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedView, setSelectedView] = useState("list"); // "list" || "grid"

  const searchParams = useSearchParams();
  const selectedTagId = searchParams.get("tag_id");
  const selectedFocusId = searchParams.get("focus_id");

  let listClassName = "notes-list-container";
  let editorClassName = "notes-editor-container";

  useEffect(() => {
    refreshNotes();
    refreshTags();
    refreshFocusModes();
  }, []);

  useEffect(() => {
    refreshNotes();
  }, [selectedTagId, selectedFocusId]);

  // TODO: Move this to NotesEditor
  useEffect(() => {
    if (noteId === "new") {
      setSelectedNote(null);
      return;
    }

    if (noteId === undefined && notes.length > 0) {
      setSelectedNote(notes[0]);
      return;
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
    let promise = null;

    if (selectedTagId) {
      promise = ApiClient.getNotesByTagId(selectedTagId);
      // } else if (selectedFocusId) {
      //   promise = ApiClient.getNotesByFocusId(selectedFocusId);
    } else {
      promise = ApiClient.getAllNotes();
    }

    promise
      .then(notes => {
        setNotes(notes);
      })
      .catch(error => {
        console.error('Error loading notes:', error);
      });
  }

  function refreshTags() {
    ApiClient.getAllTags()
      .then(tags => {
        setTags(tags);
      })
      .catch(error => {
        console.error('Error loading tags:', error);
      });
  }

  function refreshFocusModes() {
    ApiClient.getAllFocusModes()
      .then(focusModes => {
        setFocusModes(focusModes);
      })
      .catch(error => {
        console.error('Error loading focus modes:', error);
      });
  }

  // Update notes, tags, and focus modes when a note is saved
  function handleNoteSave() {
    refreshNotes();
    refreshTags();
  }

  function handleViewChange(newView) {
    setSelectedView(newView);
  }

  if (selectedView === "list") {
    listClassName = "notes-list-container"
    editorClassName = "notes-editor-container";
  } else if (selectedView === "grid") {
    listClassName = "notes-list-container grid";

    if (noteId === undefined) {
      editorClassName = "notes-editor-container is-hidden";
    } else {
      editorClassName = "notes-editor-container is-floating";
    }
  }

  return (
    <div className="page-container">
      <div className="sidebar-container">
        <Sidebar focusModes={focusModes} tags={tags} />
      </div>

      <div className={listClassName} data-page={noteId === undefined ? "notes" : "editor"}>
        <NotesList notes={notes} view={selectedView} onViewChange={handleViewChange}/>
      </div>

      <div className={editorClassName} data-page={noteId === undefined ? "notes" : "editor"}>
        <NotesEditor selectedNote={selectedNote} isNewNote={noteId === "new"} key={selectedNote?.NoteID} isFloating={noteId !== undefined && selectedView === "grid"} onSave={handleNoteSave} />
      </div>

      <MobileNavbar />

      <div className="dialog-container"></div>
    </div>
  );
}
