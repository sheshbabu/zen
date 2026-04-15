import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";
import pluralize from "../../commons/utils/pluralize.js";

export default function BulkDeleteModal({ count, onDeleteClick, onCloseClick }) {
  const label = pluralize(count, 'note');

  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer className="note-delete-modal">
        <ModalHeader title={`Delete ${count} ${label}`} onClose={onCloseClick} />
        <ModalContent>
          <p className="modal-description">{count} {label} will be moved to the Trash and <b>permanently deleted</b> after 30 days.</p>
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>Delete</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
