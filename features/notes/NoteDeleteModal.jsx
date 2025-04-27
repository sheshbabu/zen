import { h } from "../../assets/preact.esm.js"

export default function NoteDeleteModal({ onDeleteClick, onCloseClick }) {
  return (
    <div className="modal-backdrop-container is-centered">
      <div className="modal-content-container note-delete-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Delete Note</h3>
          </div>
          <p>This note will be moved to the Trash and permanently deleted after 30 days.</p>
        </div>
        <div className="model-footer-container right-aligned">
          <div className="button" onClick={onCloseClick}>Cancel</div>
          <div className="button danger" onClick={onDeleteClick}>Delete</div>
        </div>
      </div>
    </div>
  );
}