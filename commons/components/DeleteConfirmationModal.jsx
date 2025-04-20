import { h } from "../../assets/preact.esm.js"

export default function DeleteConfirmationModal({ onDeleteClick, onCloseClick }) {
  return (
    <div className="modal-backdrop-container">
      <div className="modal-content-container delete-confirmation-modal">
        <div className="modal-content">
          <p className="modal-title">Are you sure you want to delete this note?</p>
        </div>
        <div className="model-footer-container">
          <div className="button" onClick={onCloseClick}>Cancel</div>
          <div className="button primary" onClick={onDeleteClick}>Delete</div>
        </div>
      </div>
    </div>
  );
}