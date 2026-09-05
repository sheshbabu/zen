import { h, useState, useEffect } from '../../assets/preact.esm.js';
import ApiClient from '../../commons/http/ApiClient.js';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import handleCodeCopyClick from '../../commons/utils/copyCodeBlock.js';
import { closeModal, openModal } from '../../commons/components/Modal.jsx';
import Lightbox from '../../commons/components/Lightbox.jsx';
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

  function closeLightbox() {
    closeModal();
  }

  function handleContentClick(e) {
    if (handleCodeCopyClick(e) === true) {
      return;
    }

    const image = e.target.closest('.notes-editor-rendered img');
    if (image === null) {
      return;
    }
    const filename = image.src.substring(image.src.lastIndexOf('/') + 1);
    const selectedImage = {
      url: image.src,
      filename: filename,
      aspectRatio: image.naturalWidth / image.naturalHeight,
    };
    openModal(<Lightbox selectedImage={selectedImage} imageDetails={[selectedImage]} onClose={closeLightbox} />);
  }

  return (
    <div className="note-preview">
      <div className="note-preview-header">
        <div className="notes-editor-title">{titleText}</div>
      </div>
      <div className="notes-editor-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content, { hasCodeCopyButton: true }) }} onClick={handleContentClick} />
    </div>
  );
}
