import { h } from "../../assets/preact.esm.js"
import NotePreview from './NotePreview.jsx';
import BottomDrawer from "../../commons/components/BottomDrawer.jsx";
import { ModalContent, closeModal } from "../../commons/components/Modal.jsx";
import "./NotePreviewModal.css";

export default function NotePreviewModal({ noteId }) {
  function handleCloseModal() {
    closeModal('.note-modal-root');
  }

  return (
    <BottomDrawer onClose={handleCloseModal} className="note-preview-modal">
      <ModalContent className="note-preview-modal-content">
        <NotePreview noteId={noteId} />
      </ModalContent>
    </BottomDrawer>
  );
}
