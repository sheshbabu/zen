import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";
import "./NoteDeleteModal.css";

export default function NoteDeleteModal({ onDeleteClick, onCloseClick }) {
  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer className="note-delete-modal">
        <ModalHeader title="Delete Note" onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">This note will be moved to the Trash and <b>permanently deleted</b> after 30 days.</p>
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>Delete</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}