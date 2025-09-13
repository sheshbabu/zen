import { h, render } from "../../assets/preact.esm.js"
import NotesEditor from './NotesEditor.jsx';
import { CloseIcon } from "../../commons/components/Icon.jsx";
import { ModalBackdrop, ModalContainer, ModalContent } from "../../commons/components/Modal.jsx";
import { useNotes } from "../../contexts/NotesContext.jsx";
import "./NotesEditorModal.css";

export default function NotesEditorModal({ note }) {
  const { setSelectedNote } = useNotes();

  function closeModal() {
    document.title = "Zen";
    render(null, document.querySelector('.note-modal-root'));
  }

  // Set the selected note when the modal opens
  setSelectedNote(note);

  return (
    <ModalBackdrop onClose={closeModal} isCentered={true}>
      <ModalContainer className="notes-editor-modal">
        <ModalContent className="notes-editor-container">
          <NotesEditor isNewNote={false} isFloating={true} onClose={closeModal} />
        </ModalContent>
      </ModalContainer>
    </ModalBackdrop>
  );
}
