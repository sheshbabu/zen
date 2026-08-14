import { h, useState, useRef, useEffect } from "../../assets/preact.esm.js"
import Button from "../../commons/components/Button.jsx";
import { EllipsisIcon, PinIcon, ArchiveIcon, TrashIcon } from "../../commons/components/Icon.jsx";
import "./NotesEditorMenu.css";

export default function NotesEditorMenu({ note, isNewNote, onPinClick, onUnpinClick, onArchiveClick, onUnarchiveClick, onRestoreClick, onDeleteClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownRef]);

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleItemClick(action) {
    setIsDropdownOpen(false);
    action();
  }

  const items = [];

  if (isNewNote !== true && note?.isDeleted !== true && note?.isArchived !== true) {
    const pinLabel = note?.isPinned === true ? "Unpin" : "Pin";
    const pinAction = note?.isPinned === true ? onUnpinClick : onPinClick;
    items.push(
      <li key="pin" className="notes-editor-menu-option" onClick={() => handleItemClick(pinAction)}>
        <PinIcon isPinned={note?.isPinned === true} />
        <span>{pinLabel}</span>
      </li>
    );
  }

  if (isNewNote !== true && note?.isDeleted !== true) {
    const archiveLabel = note?.isArchived === true ? "Unarchive" : "Archive";
    const archiveAction = note?.isArchived === true ? onUnarchiveClick : onArchiveClick;
    items.push(
      <li key="archive" className="notes-editor-menu-option" onClick={() => handleItemClick(archiveAction)}>
        <ArchiveIcon />
        <span>{archiveLabel}</span>
      </li>
    );
  }

  if (isNewNote !== true && note?.isDeleted === true) {
    items.push(
      <li key="restore" className="notes-editor-menu-option" onClick={() => handleItemClick(onRestoreClick)}>
        <ArchiveIcon />
        <span>Restore</span>
      </li>
    );
  }

  if (isNewNote !== true && note?.isDeleted !== true) {
    items.push(
      <li key="delete" className="notes-editor-menu-option is-destructive" onClick={() => handleItemClick(onDeleteClick)}>
        <TrashIcon />
        <span>Delete</span>
      </li>
    );
  }

  if (items.length === 0) {
    return null;
  }

  let footer = null;
  if (isNewNote !== true && note != null) {
    const createdAtText = formatFullDate(note.createdAt);
    const updatedAtText = formatFullDate(note.updatedAt);
    footer = (
      <div className="notes-editor-menu-footer">
        <div><span>Created</span><span>{createdAtText}</span></div>
        <div><span>Modified</span><span>{updatedAtText}</span></div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`notes-editor-menu dropdown-container ${isDropdownOpen ? 'is-open' : ''}`}>
      <Button variant="ghost" onClick={handleDropdownClick}><EllipsisIcon /></Button>
      <div className="notes-editor-menu-dropdown">
        <ul className="notes-editor-menu-options">
          {items}
        </ul>
        {footer}
      </div>
    </div>
  );
}

function formatFullDate(dateString) {
  if (typeof dateString !== 'string' || dateString === "") {
    return "";
  }
  return new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'medium' });
}
