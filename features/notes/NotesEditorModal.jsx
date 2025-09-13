import { h } from "../../assets/preact.esm.js"
import NotesEditor from './NotesEditor.jsx';
import { ModalBackdrop, ModalContainer, ModalContent, closeModal } from "../../commons/components/Modal.jsx";
import { useNotes } from "../../contexts/NotesContext.jsx";
import "./NotesEditorModal.css";

export default function NotesEditorModal({ note }) {
  const { setSelectedNote } = useNotes();

  function handleCloseModal() {
    document.title = "Zen";
    closeModal('.note-modal-root');
  }

  // Set the selected note when the modal opens
  setSelectedNote(note);

  return (
    <ModalBackdrop onClose={handleCloseModal} isCentered={true}>
      <ModalContainer className="notes-editor-modal">
        <ModalContent className="notes-editor-container">
          <NotesEditor isNewNote={false} isFloating={true} onClose={handleCloseModal} />
        </ModalContent>
      </ModalContainer>
    </ModalBackdrop>
  );
}
