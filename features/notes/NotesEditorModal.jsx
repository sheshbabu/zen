import { h } from "../../assets/preact.esm.js"
import NotesEditor from './NotesEditor.jsx';
import { ModalBackdrop, ModalContainer, ModalContent, closeModal } from "../../commons/components/Modal.jsx";
import { useNotes } from "../../commons/contexts/NotesContext.jsx";
import "./NotesEditorModal.css";

export default function NotesEditorModal({ note, isNewNote, onModalClose }) {
  const { setSelectedNote } = useNotes();

  function handleCloseModal() {
    document.title = "Zen";
    closeModal('.note-modal-root');
    if (onModalClose) {
      onModalClose();
    }
  }

  if (isNewNote !== true) {
    setSelectedNote(note);
  }

  return (
    <ModalBackdrop onClose={handleCloseModal} isCentered={true}>
      <ModalContainer className="notes-editor-modal">
        <ModalContent className="notes-editor-container">
          <NotesEditor isNewNote={isNewNote === true} isModal={true} onClose={handleCloseModal} />
        </ModalContent>
      </ModalContainer>
    </ModalBackdrop>
  );
}
