import { h, render, useState, useRef, useEffect, useCallback } from "../../assets/preact.esm.js"
import ApiClient from '../../commons/http/ApiClient.js';
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import NotesEditorFormattingToolbar from './NotesEditorFormattingToolbar.jsx';
import TableOfContents from './TableOfContents.jsx';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import navigateTo from '../../commons/utils/navigateTo.js';
import isMobile from '../../commons/utils/isMobile.js';
import NoteDeleteModal from '../../components/NoteDeleteModal.jsx';
import DropdownMenu from '../../commons/components/DropdownMenu.jsx';
import Button from '../../commons/components/Button.jsx';
import { showToast } from '../../commons/components/Toast.jsx';
import "./NotesEditor.css";
import { CloseIcon, SidebarCloseIcon, SidebarOpenIcon, BackIcon } from "../../commons/components/Icon.jsx";

export default function NotesEditor({ selectedNote, isNewNote, isFloating, onChange, onClose, onPinToggle }) {
  if (!isNewNote && selectedNote === null) {
    return null;
  }

  const [isEditable, setIsEditable] = useState(isNewNote);
  const [title, setTitle] = useState(selectedNote?.title || "");
  const [content, setContent] = useState(selectedNote?.content || "");
  const [tags, setTags] = useState(selectedNote?.tags || []);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  let contentArea = null;

  useEffect(() => {
    if (isNewNote || (isEditable && titleRef.current?.textContent === "")) {
      titleRef.current.focus();
    }

    if (!isNewNote) {
      document.title = title === "" ? "Zen" : title;
    }
  }, []);

  useEffect(() => {
    handleTextAreaHeight();
  }, [content, isEditable]);

  // ...other logic as before...

  // Add handlers for force delete
  function handleForceDeleteClick() {
    render(
      <NoteDeleteModal
        onDeleteClick={handleForceDeleteConfirmClick}
        onCloseClick={handleDeleteCloseClick}
        description="This note will be permanently deleted. This cannot be undone."
        deleteButtonText="Delete Permanently"
      />, 
      document.querySelector('.modal-root')
    );
  }

  function handleForceDeleteConfirmClick() {
    ApiClient.forceDeleteNote(selectedNote.noteId)
      .then(() => {
        handleDeleteCloseClick();
        if (onClose) {
          onClose();
        } else {
          navigateTo("/", true);
        }
        onChange();
      });
  }

  function handleDeleteCloseClick() {
    render(null, document.querySelector('.modal-root'));
  }

  // ...existing delete/archive logic...

  return (
    <div className={`notes-editor ${isEditable ? "is-editable" : ""}`} tabIndex="0" onPaste={handlePaste}>
      <Toolbar
        note={selectedNote}
        isNewNote={isNewNote}
        isEditable={isEditable}
        isFloating={isFloating}
        isSaveLoading={isSaveLoading}
        isExpanded={isExpanded}
        onSaveClick={handleSaveClick}
        onEditClick={handleEditClick}
        onEditCancelClick={handleEditCancelClick}
        onCloseClick={handleCloseClick}
        onDeleteClick={handleDeleteClick}
        onForceDeleteClick={handleForceDeleteClick}
        onArchiveClick={handleArchiveClick}
        onUnarchiveClick={handleUnarchiveClick}
        onRestoreClick={handleRestoreClick}
        onExpandToggleClick={handleExpandToggleClick}
        onPinClick={handlePinClick}
        onUnpinClick={handleUnpinClick}
      />
      {/* ...rest unchanged... */}
    </div>
  );
}

function Toolbar({ note, isNewNote, isEditable, isFloating, isSaveLoading, isExpanded, onSaveClick, onEditClick, onEditCancelClick, onCloseClick, onDeleteClick, onForceDeleteClick, onArchiveClick, onUnarchiveClick, onRestoreClick, onExpandToggleClick, onPinClick, onUnpinClick }) {
  const rightToolbarActions = [];
  const leftToolbarActions = [];
  const menuActions = [];
  const saveButtonText = isSaveLoading ? "Saving..." : "Save";

  function handleClick(e) {
    if (e.target.className !== "notes-editor-toolbar") {
      e.stopPropagation();
      return;
    }
    document.querySelector(".notes-editor-container").scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ...toolbar logic as before...

  if (!isNewNote) {
    if (note.isPinned === true) {
      menuActions.push(
        <div style="width: 80px;" onClick={onUnpinClick}>Unpin</div>
      );
    } else {
      menuActions.push(
        <div style="width: 80px;" onClick={onPinClick}>Pin</div>
      );
    }

    if (note.isArchived) {
      menuActions.push(
        <div style="width: 80px;" onClick={onUnarchiveClick}>Unarchive</div>
      );
    } else if (!note.isDeleted) {
      menuActions.push(
        <div style="width: 80px;" onClick={onArchiveClick}>Archive</div>
      );
    }

    if (note.isDeleted) {
      menuActions.push(
        <div style="width: 80px;" onClick={onRestoreClick}>Restore</div>
      );
      // Add "Delete Permanently" in Trash
      menuActions.push(
        <div style="width: 160px; color: red;" onClick={onForceDeleteClick}>
          Delete Permanently
        </div>
      );
    } else {
      menuActions.push(
        <div style="width: 80px;" onClick={onDeleteClick}>Delete</div>
      );
    }
  }

  return (
    <div className="notes-editor-toolbar" onClick={handleClick}>
      <div className="left-toolbar">
        {leftToolbarActions}
      </div>
      <div className="right-toolbar">
        {rightToolbarActions}
        <DropdownMenu actions={menuActions} />
      </div>
    </div>
  );
}