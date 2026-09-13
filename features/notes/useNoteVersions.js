import { h } from "../../assets/preact.esm.js";
import ApiClient from "../../commons/http/ApiClient.js";
import { openModal, closeModal } from "../../commons/components/Modal.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import { useNotes } from "../../commons/contexts/NotesContext.jsx";
import NoteVersionsModal from "./NoteVersionsModal.jsx";

export default function useNoteVersions({ note, onRestored, cancelAutoSave }) {
  const { handleNoteChange } = useNotes();

  function handleVersionsCloseClick() {
    closeModal('.note-modal-root');
  }

  function handleVersionRestoreClick(versionId) {
    // A pending autosave still holds the pre-restore text, so drop it before
    // the request rather than after, or it overwrites what we just restored.
    cancelAutoSave();

    return ApiClient.restoreNoteVersion(note.noteId, versionId)
      .then(restoredNote => {
        handleVersionsCloseClick();
        showToast("Note restored.");
        onRestored(restoredNote);
        handleNoteChange();
      })
      .catch(() => {
        showToast("Failed to restore note.");
      });
  }

  function handleVersionsClick() {
    openModal(
      <NoteVersionsModal
        note={note}
        onRestoreClick={handleVersionRestoreClick}
        onCloseClick={handleVersionsCloseClick}
      />,
      '.note-modal-root'
    );
  }

  return {
    handleVersionsClick
  };
}
