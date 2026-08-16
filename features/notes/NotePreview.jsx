import { h, useState, useEffect } from '../../assets/preact.esm.js';
import ApiClient from '../../commons/http/ApiClient.js';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import handleCodeCopyClick from '../../commons/utils/copyCodeBlock.js';
import './NotePreview.css';
import './NotesEditor.css';


export default function NotePreview({ noteId }) {
  const [note, setNote] = useState(null);

  useEffect(() => {
    ApiClient.getNoteById(noteId)
      .then(setNote)
      .catch(() => setNote(null));
  }, [noteId]);

  if (note === null) {
    return null;
  }

  const titleText = note.title !== "" ? note.title : "Untitled";

  return (
    <div className="note-preview">
      <div className="note-preview-header">
        <div className="notes-editor-title">{titleText}</div>
      </div>
      <div className="notes-editor-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content, { hasCodeCopyButton: true }) }} onClick={handleCodeCopyClick} />
    </div>
  );
}
