import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";
import "./NoteDeleteModal.css";

export default function NoteDeleteModal({ onDeleteClick, onCloseClick, description, deleteButtonText }) {
  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer className="note-delete-modal">
        <ModalHeader title="Delete Note" onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">
            {description || "This note will be moved to the Trash and permanently deleted after 30 days."}
          </p>
        </ModalContent>
        <div className="model-footer-container right-aligned">
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>
            {deleteButtonText || "Delete"}
          </Button>
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}