import { h } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";
import pluralize from "../../commons/utils/pluralize.js";

export default function BulkDeleteModal({ count, isPermanent = false, onDeleteClick, onCloseClick }) {
  const label = pluralize(count, 'note');

  let title = `Delete ${count} ${label}`;
  let description = <p className="modal-description">{count} {label} will be moved to the Trash and <b>permanently deleted</b> after 30 days.</p>;
  let buttonText = "Delete";
  if (isPermanent) {
    title = `Permanently delete ${count} ${label}`;
    description = <p className="modal-description">{count} {label} will be <b>permanently deleted</b>. This can't be undone.</p>;
    buttonText = "Delete Forever";
  }

  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer className="note-delete-modal">
        <ModalHeader title={title} onClose={onCloseClick} />
        <ModalContent>
          {description}
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="danger" onClick={onDeleteClick}>{buttonText}</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
