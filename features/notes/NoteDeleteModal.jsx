import { h } from "../../assets/preact.esm.js"
import { CloseIcon } from "../../commons/components/Icon.jsx";

export default function NoteDeleteModal({ onDeleteClick, onCloseClick }) {
  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      onCloseClick();
    }
  }

  return (
    <div className="modal-backdrop-container is-centered" onClick={handleBackdropClick}>
      <div className="modal-content-container note-delete-modal">
        <div className="modal-header">
          <h3 className="modal-title">Delete Note</h3>
          <CloseIcon className="notes-editor-toolbar-button-close" onClick={onCloseClick} />
        </div>
        <div className="modal-content">
          <p className="modal-description">This note will be moved to the Trash and <b>permanently deleted</b> after 30 days.</p>
        </div>
        <div className="model-footer-container right-aligned">
          <div className="button" onClick={onCloseClick}>Cancel</div>
          <div className="button danger" onClick={onDeleteClick}>Delete</div>
        </div>
      </div>
    </div>
  );
}