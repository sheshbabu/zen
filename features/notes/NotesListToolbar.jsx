import { h } from "../../assets/preact.esm.js"
import { ListViewIcon, CardViewIcon, GalleryViewIcon, HamburgerIcon } from "../../commons/components/Icon.jsx";
import ButtonGroup from "../../commons/components/ButtonGroup.jsx";
import "./NotesListToolbar.css";

export default function NotesListToolbar({ onListViewClick, onCardViewClick, onGalleryViewClick, onSidebarToggle }) {
  return (
    <div className="notes-list-toolbar">
      <ButtonGroup isMobile={true}>
        <div onClick={() => onSidebarToggle()}>
          <HamburgerIcon />
        </div>
      </ButtonGroup>
      <ButtonGroup>
        <div onClick={() => onListViewClick()} title="List View">
          <ListViewIcon />
        </div>
        <div onClick={() => onCardViewClick()} title="Card View">
          <CardViewIcon />
        </div>
        <div onClick={() => onGalleryViewClick()} title="Gallery View">
          <GalleryViewIcon />
        </div>
      </ButtonGroup>
    </div>
  );
}

