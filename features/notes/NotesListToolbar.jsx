import { h } from "../../assets/preact.esm.js"
import { ListViewIcon, CardViewIcon, GalleryViewIcon } from "../../commons/components/Icon.jsx";

export default function NotesListToolbar({ onListViewClick, onCardViewClick }) {
  return (
    <div className="notes-list-toolbar">
      <div onClick={() => onListViewClick()}>
        <ListViewIcon />
      </div>
      <div onClick={() => onCardViewClick()}>
        <CardViewIcon />
      </div>
      <div onClick={() => onCardViewClick()}>
        <GalleryViewIcon />
      </div>
    </div>
  );
}

