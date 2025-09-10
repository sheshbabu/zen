import { h, render } from "../../assets/preact.esm.js"
import NotesEditor from './NotesEditor.jsx';
import { CloseIcon } from "../../commons/components/Icon.jsx";
import { ModalBackdrop, ModalContainer, ModalContent } from "../../commons/components/Modal.jsx";
import "./NotesEditorModal.css";

export default function NotesEditorModal({ note, onChange, onPinToggle }) {

  function closeModal() {
    document.title = "Zen";
    render(null, document.querySelector('.note-modal-root'));
  }

  function handleEditorChange() {
    if (onChange) {
        onChange();
    }
  }

  return (
    <ModalBackdrop onClose={closeModal} isCentered={true}>
      <ModalContainer className="notes-editor-modal">
        <ModalContent className="notes-editor-container">
          <NotesEditor selectedNote={note} isNewNote={false} isFloating={true} onChange={handleEditorChange} onClose={closeModal} onPinToggle={onPinToggle} />
        </ModalContent>
      </ModalContainer>
    </ModalBackdrop>
  );
}
