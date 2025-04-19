import { h } from "../../assets/preact.esm.js"
import { ListViewIcon, GridViewIcon } from "../../commons/components/Icon.jsx";

export default function NotesListToolbar({ onListViewClick, onGridViewClick }) {
  return (
    <div className="notes-list-toolbar">
      <div onClick={() => onListViewClick()}>
        <ListViewIcon />
      </div>
      <div onClick={() => onGridViewClick()}>
        <GridViewIcon />
      </div>
    </div>
  );
}

