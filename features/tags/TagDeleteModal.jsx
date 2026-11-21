import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";

export default function TagDeleteModal({ onDeleteClick, onCloseClick }) {
  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer>
        <ModalHeader title="Delete Tag" onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">This tag will be removed from all notes and <b>permanently deleted</b>. This action cannot be undone.</p>
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>Delete</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
