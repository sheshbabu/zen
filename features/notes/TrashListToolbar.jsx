import { h } from "../../assets/preact.esm.js"
import { HamburgerIcon, BrushCleaningIcon } from "../../commons/components/Icon.jsx";
import ButtonGroup from "../../commons/components/ButtonGroup.jsx";
import { openModal } from "../../commons/components/Modal.jsx";
import { AppProvider } from '../../contexts/AppContext.jsx';
import { NotesProvider, useNotes } from "../../contexts/NotesContext.jsx";
import TrashClearModal from "./TrashClearModal.jsx"
import "./NotesListToolbar.css";

export default function TrashListToolbar({ onSidebarToggle }) {
  const { refreshNotes } = useNotes();

  function handleTrashCleared() {
    refreshNotes(null, null, false, true);
  }

  function handleClearTrash() {
    openModal(
      <AppProvider>
        <NotesProvider>
          <TrashClearModal onTrashCleared={handleTrashCleared} />
        </NotesProvider>
      </AppProvider>
    );
  }

  return (
    <div className="notes-list-toolbar">
      <ButtonGroup isMobile={true}>
        <div onClick={() => onSidebarToggle()}>
          <HamburgerIcon />
        </div>
      </ButtonGroup>
      <ButtonGroup>
        <div onClick={handleClearTrash} title="Clear Trash">
          <BrushCleaningIcon />
        </div>
      </ButtonGroup>
    </div>
  );
}