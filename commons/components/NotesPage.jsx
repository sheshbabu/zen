import { h, useState, useEffect } from '../../dependencies/preact.esm.js';
import { useAppContext } from '../../AppContext.jsx';
import Sidebar from './Sidebar.jsx';
import NotesList from './NotesList.jsx';
import NotesEditor from './NotesEditor.jsx';
import MobileNavbar from './MobileNavbar.jsx';
import ApiClient from "../http/ApiClient.js";
import useSearchParams from "./useSearchParams.jsx";

export default function NotesPage({ noteId }) {
  const { appContext } = useAppContext();
  const { focusModes, tags } = appContext;

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const searchParams = useSearchParams();
  const selectedTagId = searchParams.get("tag_id");
  const selectedFocusId = searchParams.get("focus_id");

  useEffect(() => {
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

  return (
    <div className="page-container">
      <div className="sidebar-container">
        <Sidebar focusModes={focusModes} tags={tags} />
      </div>

      <div className="notes-list-container" data-page={noteId === undefined ? "notes" : "editor"}>
        <NotesList notes={notes} />
      </div>

      <div className="notes-editor-container" data-page={noteId === undefined ? "notes" : "editor"}>
        <NotesEditor selectedNote={selectedNote} isNewNote={noteId === "new"} key={selectedNote?.NoteID}/>
      </div>

      <MobileNavbar />

      <div className="dialog-container"></div>
    </div>
  );
}
