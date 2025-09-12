import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";

export default function TemplateDeleteModal({ onDeleteClick, onCloseClick }) {
  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer>
        <ModalHeader title="Delete Template" onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">This template will be <b>permanently deleted</b>. This action cannot be undone.</p>
        </ModalContent>
        <div className="model-footer-container right-aligned">
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>Delete</Button>
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}