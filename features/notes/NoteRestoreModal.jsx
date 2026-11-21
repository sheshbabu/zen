import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";

export default function NoteRestoreModal({ onRestoreClick, onCloseClick }) {
  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer>
        <ModalHeader title="Restore Version" onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">The note's current title and content will be replaced with this version.</p>
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onRestoreClick}>Restore</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
