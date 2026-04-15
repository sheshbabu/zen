import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";
import "./CanvasDeleteModal.css";

export default function CanvasDeleteModal({ onDeleteClick, onCloseClick }) {
  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer className="canvas-delete-modal">
        <ModalHeader title="Delete Canvas" onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">Are you sure you want to <b>permanently delete</b> this canvas?</p>
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>Delete</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
