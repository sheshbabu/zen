import { h } from "../../assets/preact.esm.js"
import { ListViewIcon, CardViewIcon, GalleryViewIcon, BrushCleaningIcon } from "../../commons/components/Icon.jsx";
import useSearchParams from "../../commons/components/useSearchParams.jsx";
import { openModal } from "../../commons/components/Modal.jsx";
import { AppProvider, useAppContext } from '../../commons/contexts/AppContext.jsx';
import { NotesProvider, useNotes } from "../../commons/contexts/NotesContext.jsx";
import { HamburgerIcon } from '../../commons/components/Icon.jsx';
import ButtonGroup from '../../commons/components/ButtonGroup.jsx';
import navigateTo from "../../commons/utils/navigateTo.js";
import isMobile from "../../commons/utils/isMobile.js";
import TrashClearModal from "./TrashClearModal.jsx"
import "./NotesListToolbar.css";

export default function NotesListToolbar({ onSidebarToggle, onViewChange }) {
  const searchParams = useSearchParams();
  const { refreshNotes } = useNotes();
  const { tags, focusModes } = useAppContext();

  const selectedTagId = searchParams.get("tagId");
  const selectedFocusId = searchParams.get("focusId");
  const isArchivesPage = searchParams.get("isArchived") === "true";
  const isTrashPage = searchParams.get("isDeleted") === "true";

  let listName = "All Notes";

  if (selectedFocusId !== null) {
    const focusId = parseInt(selectedFocusId, 10);
    const focusMode = focusModes.find(fm => fm.focusId === focusId);
    if (focusMode !== undefined) {
      listName = focusMode.name;
    }
  } else if (selectedTagId !== null) {
    const tagId = parseInt(selectedTagId, 10);
    const tag = tags.find(t => t.tagId === tagId);
    if (tag !== undefined) {
      listName = tag.name;
    }
  } else if (isArchivesPage === true) {
    listName = "Archived";
  } else if (isTrashPage === true) {
    listName = "Trash";
  }

  function handleTrashCleared() {
    navigateTo("/notes/?isDeleted=true")
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
    <Toolbar actions={actions} onSidebarToggle={onSidebarToggle} listName={listName} className="notes-list-toolbar" />
  );
}

function Toolbar({ actions, onSidebarToggle, listName, className }) {
  const buttons = actions.map(action => (
    <div key={action.title} {...action}>
      <action.icon />
    </div>
  ));

  let title = null;
  if (isMobile() === true) {
    title = <div className="notes-list-toolbar-name">{listName}</div>;
  }

  return (
    <div className={className}>
      <ButtonGroup isMobile={true}>
        <div onClick={onSidebarToggle} title="Toggle Sidebar">
          <HamburgerIcon />
        </div>
      </ButtonGroup>
      {title}
      <ButtonGroup>
        {buttons}
      </ButtonGroup>
    </div>
  );
}