import { h } from "../../assets/preact.esm.js"
import { ListViewIcon, CardViewIcon, GalleryViewIcon, BrushCleaningIcon } from "../../commons/components/Icon.jsx";
import useSearchParams from "../../commons/components/useSearchParams.jsx";
import { openModal } from "../../commons/components/Modal.jsx";
import { AppProvider } from '../../commons/contexts/AppContext.jsx';
import { NotesProvider, useNotes } from "../../commons/contexts/NotesContext.jsx";
import { HamburgerIcon } from '../../commons/components/Icon.jsx';
import ButtonGroup from '../../commons/components/ButtonGroup.jsx';
import TrashClearModal from "./TrashClearModal.jsx"
import "./NotesListToolbar.css";

export default function NotesListToolbar({ onSidebarToggle, onViewChange }) {
  const searchParams = useSearchParams();
  const { refreshNotes } = useNotes();

  const isTrashPage = searchParams.get("isDeleted") === "true";

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

  let actions = [];

  if (isTrashPage) {
    actions = [
      {
        icon: BrushCleaningIcon,
        onClick: handleClearTrash,
        title: 'Clear Trash'
      }
    ];
  } else {
    actions = [
      {
        icon: ListViewIcon,
        onClick: () => onViewChange("list"),
        title: 'List View'
      },
      {
        icon: CardViewIcon,
        onClick: () => onViewChange("card"),
        title: 'Card View'
      },
      {
        icon: GalleryViewIcon,
        onClick: () => onViewChange("gallery"),
        title: 'Gallery View'
      }
    ];
  }

  return (
    <Toolbar actions={actions} onSidebarToggle={onSidebarToggle} className="notes-list-toolbar" />
  );
}

function Toolbar({ actions, onSidebarToggle, className }) {
  const buttons = actions.map((action, index) => (
    <div key={index} {...action}>
      <action.icon />
    </div>
  ));

  return (
    <div className={className}>
      <ButtonGroup isMobile={true}>
        <div onClick={onSidebarToggle} title="Toggle Sidebar">
          <HamburgerIcon />
        </div>
      </ButtonGroup>
      <ButtonGroup>
        {buttons}
      </ButtonGroup>
    </div>
  );
}