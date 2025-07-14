import { h, render } from "../../assets/preact.esm.js"
import NotesEditor from './NotesEditor.jsx';
import { CloseIcon } from "../../commons/components/Icon.jsx";
import "./NotesEditorModal.css";

export default function NotesEditorModal({ note, onChange }) {
  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      closeModal();
    }
  }

  function closeModal() {
    document.title = "Zen";
    render(null, document.querySelector('.note-modal-root'));
  }

  function handleEditorChange() {
    if (onChange) {
        onChange();
    }
  }

  return (
    <div className="modal-backdrop-container is-centered" onClick={handleBackdropClick}>
      <div className="modal-content-container notes-editor-modal">
        <div className="modal-content notes-editor-container">
          <NotesEditor selectedNote={note} isNewNote={false} isFloating={true} onChange={handleEditorChange} onClose={closeModal} />
        </div>
      </div>
    </div>
  );
}
