import { h } from "../../assets/preact.esm.js"
import { ListViewIcon, CardViewIcon, GalleryViewIcon, HamburgerIcon } from "../../commons/components/Icon.jsx";
import "./NotesListToolbar.css";

export default function NotesListToolbar({ onListViewClick, onCardViewClick, onGalleryViewClick, onSidebarToggle }) {
  return (
    <div className="notes-list-toolbar">
      <div className="button-group is-mobile">
        <div onClick={() => onSidebarToggle()}>
          <HamburgerIcon />
        </div>
      </div>
      <div className="button-group">
        <div onClick={() => onListViewClick()}>
          <ListViewIcon />
        </div>
        <div onClick={() => onCardViewClick()}>
          <CardViewIcon />
        </div>
        <div onClick={() => onGalleryViewClick()}>
          <GalleryViewIcon />
        </div>
      </div>
    </div>
  );
}

