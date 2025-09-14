import { h, useState, useRef, useEffect, useCallback } from "../../assets/preact.esm.js"
import ApiClient from '../../commons/http/ApiClient.js';
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import NotesEditorFormattingToolbar from './NotesEditorFormattingToolbar.jsx';
import TableOfContents from './TableOfContents.jsx';
import TemplatePicker from '../templates/TemplatePicker.jsx';
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import navigateTo from '../../commons/utils/navigateTo.js';
import isMobile from '../../commons/utils/isMobile.js';
import NoteDeleteModal from './NoteDeleteModal.jsx';
import DropdownMenu from '../../commons/components/DropdownMenu.jsx';
import Button from '../../commons/components/Button.jsx';
import { showToast } from '../../commons/components/Toast.jsx';
import { closeModal, openModal } from '../../commons/components/Modal.jsx';
import { useNotes } from "../../contexts/NotesContext.jsx";
import { useVisibleHeadings } from "./useVisibleHeadings.js";
import useEditorKeyboardShortcuts from "./useEditorKeyboardShortcuts.js";
import useImageUpload from "./useImageUpload.js";
import useMarkdownFormatter from "./useMarkdownFormatter.js";
import "./NotesEditor.css";
import { CloseIcon, SidebarCloseIcon, SidebarOpenIcon, BackIcon } from "../../commons/components/Icon.jsx";

export default function NotesEditor({ isNewNote, isFloating, onClose }) {
  const { selectedNote, handleNoteChange, handlePinToggle } = useNotes();

  if (!isNewNote && selectedNote === null) {
    return null;
  }

  const [isEditable, setIsEditable] = useState(isNewNote);
  const [title, setTitle] = useState(selectedNote?.title || "");
  const [content, setContent] = useState(selectedNote?.content || "");
  const [tags, setTags] = useState(selectedNote?.tags || []);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const contentRef = useRef(null);

  const visibleHeadings = useVisibleHeadings(contentRef, content, isEditable, isExpanded);

  const { insertAtCursor, formatSelectedText, applyMarkdownFormat } = useMarkdownFormatter({
    textareaRef,
    setContent
  });

  const {
    isDraggingOver,
    attachments,
    fileInputRef,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleImageDrop,
    handleDropzoneClick,
    handleFileInputChange,
    resetAttachments
  } = useImageUpload({ insertAtCursor });

  let contentArea = null;

  useEffect(() => {
    if (isNewNote === true || (isEditable === true && titleRef.current?.textContent === "")) {
      titleRef.current?.focus();
    }

    if (isNewNote !== true) {
      document.title = title === "" ? "Zen" : title;
    }
  }, []);

  useEffect(() => {
    handleTextAreaHeight();
  }, [content, isEditable]);

  const handleSaveClick = useCallback(() => {
    const currentTitle = titleRef.current?.textContent || "";
    const currentContent = textareaRef.current?.value || content;

    const note = {
      title: currentTitle,
      content: currentContent,
      tags: tags,
    };

    setTitle(currentTitle);
    setContent(currentContent);

    let promise = null;
    setIsSaveLoading(true);

    if (isNewNote) {
      promise = ApiClient.createNote(note);
    } else {
      promise = ApiClient.updateNote(selectedNote.noteId, note);
    }

    promise
      .then(note => {
        setIsEditable(false);
        resetAttachments();

        if (isNewNote && !onClose) {
          navigateTo(`/notes/${note.noteId}`, true);
        }

        handleNoteChange();
      })
      .finally(() => {
        setIsSaveLoading(false);
      });
  }, [content, tags, isNewNote, selectedNote, handleNoteChange, resetAttachments]);

  const { handleKeyDown } = useEditorKeyboardShortcuts({
    isEditable,
    isFloating,
    isExpanded,
    textareaRef,
    onSave: handleSaveClick,
    onEdit: handleEditClick,
    onClose: handleCloseClick,
    onExpandToggle: handleExpandToggleClick,
    onInsertAtCursor: insertAtCursor,
    onFormatText: formatSelectedText
  });

  function handleTextAreaHeight() {
    if (textareaRef.current === null) {
      return;
    }

    const textarea = textareaRef.current;
    // scrollHeight is height of content and padding
    // It doesn't include border, margin, or scrollbar
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  }

  function handleEditClick() {
    setIsEditable(true);
  }

  function handleEditCancelClick() {
    if (isNewNote) {
      if (onClose) {
        onClose();
      } else {
        navigateTo("/", true);
      }
    } else {
      setIsEditable(false);
    }
  }

  // https://blixtdev.com/how-to-use-contenteditable-with-react/
  function handleTitleChange(e) {
    const newTitle = e.target.textContent;
    setTitle(newTitle);
  }

  function handleAddTag(tag) {
    setTags((prevTags) => [...prevTags, tag]);
  }

  function handleRemoveTag(tag) {
    setTags((prevTags) => prevTags.filter(t => t.tagId !== tag.tagId));
  }

  function handleCloseClick() {
    if (onClose) {
      onClose();
    } else {
      navigateTo("/", true);
    }
  }

  function handleDeleteClick() {
    openModal(
      <NoteDeleteModal
        onDeleteClick={handleDeleteConfirmClick}
        onCloseClick={handleDeleteCloseClick}
      />);
  }

  function handleDeleteConfirmClick() {
    ApiClient.deleteNote(selectedNote.noteId)
      .then(() => {
        handleDeleteCloseClick();
        if (onClose) {
          onClose();
        } else {
          navigateTo("/", true);
        }
        handleNoteChange();
      });
  }

  function handleDeleteCloseClick() {
    closeModal();
  }

  function handleArchiveClick() {
    ApiClient.archiveNote(selectedNote.noteId)
      .then(() => {
        showToast("Note archived.");
        handleNoteChange();
      });
  }

  function handleUnarchiveClick() {
    ApiClient.unarchiveNote(selectedNote.noteId)
      .then(() => {
        showToast("Note unarchived.");
        handleNoteChange();
      });
  }

  function handleRestoreClick() {
    ApiClient.restoreNote(selectedNote.noteId)
      .then(() => {
        handleNoteChange();
      });
  }

  function handleExpandToggleClick() {
    setIsExpanded((prev) => !prev);
    const editor = document.querySelector('.notes-editor-container');
    if (isExpanded) {
      editor.classList.remove('is-expanded');
    } else {
      editor.classList.add('is-expanded');
    }
  }

  function handlePinClick() {
    if (handlePinToggle && selectedNote) {
      handlePinToggle(selectedNote.noteId, selectedNote.isPinned);
    }
  }

  function handleUnpinClick() {
    if (handlePinToggle && selectedNote) {
      handlePinToggle(selectedNote.noteId, selectedNote.isPinned);
    }
  }

  function handleTemplateApply(templateTitle, templateContent, templateTags) {
    if (templateTitle && templateTitle.trim() !== "") {
      setTitle(templateTitle);
    }

    setContent(templateContent);

    if (templateTags && templateTags.length > 0) {
      setTags(templateTags);
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = templateContent.length;
        textareaRef.current.selectionStart = length;
        textareaRef.current.selectionEnd = length;
      }
    }, 0);
  }

  if (isEditable) {
    contentArea = (
      <textarea
        className="notes-editor-textarea"
        placeholder="Write here..."
        spellCheck="false"
        ref={textareaRef}
        value={content}
        onInput={handleTextAreaHeight}
        onBlur={e => setContent(e.target.value)}
      />
    );
  } else if (title === "" && content === "") {
    contentArea = (
      <div className="notes-editor-empty-text">Empty note</div>
    );
  } else {
    contentArea = (
      <div className="notes-editor-rendered" ref={contentRef} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    );
  }

  const imagePreviewItems = attachments.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return (
      <img src={imageUrl} alt={`Attachment ${index}`} />
    );
  });

  let templatePicker = null;
  if (isNewNote === true && isEditable === true && title === "" && content === "") {
    templatePicker = <TemplatePicker onTemplateApply={handleTemplateApply} />;
  }

  // TODO: remove "is-editable" CSS and use JS
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
        onArchiveClick={handleArchiveClick}
        onUnarchiveClick={handleUnarchiveClick}
        onRestoreClick={handleRestoreClick}
        onExpandToggleClick={handleExpandToggleClick}
        onPinClick={handlePinClick}
        onUnpinClick={handleUnpinClick}
      />
      <div className="notes-editor-header">
        <div className="notes-editor-title" contentEditable={isEditable} ref={titleRef} onBlur={handleTitleChange} dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <NotesEditorTags tags={tags} isEditable={isEditable} canCreateTag onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
      <div className={`notes-editor-image-dropzone ${isDraggingOver ? "dragover" : ""}`} onDrop={handleImageDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={handleDropzoneClick}>
        Click to upload or drag and drop images
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileInputChange} style={{ display: "none" }} />
      </div>
      <div className="notes-editor-image-attachment-preview">{imagePreviewItems}</div>
      <NotesEditorFormattingToolbar isEditable={isEditable} onFormat={applyMarkdownFormat} />
      <div className="notes-editor-content">
        {contentArea}
      </div>
      {templatePicker}
      <TableOfContents content={content} isExpanded={isExpanded} isEditable={isEditable} isNewNote={isNewNote} visibleHeadings={visibleHeadings} />
    </div>
  );
}

function Toolbar({ note, isNewNote, isEditable, isFloating, isSaveLoading, isExpanded, onSaveClick, onEditClick, onEditCancelClick, onCloseClick, onDeleteClick, onArchiveClick, onUnarchiveClick, onRestoreClick, onExpandToggleClick, onPinClick, onUnpinClick }) {
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

  if (isFloating) {
    rightToolbarActions.push(
      <Button variant="ghost" onClick={onCloseClick}><CloseIcon /></Button>
    );
  }

  if (!isFloating && !isMobile()) {
    if (isExpanded) {
      leftToolbarActions.push(
        <Button variant="ghost" onClick={onExpandToggleClick}><SidebarCloseIcon /></Button>
      );
    } else {
      leftToolbarActions.push(
        <Button variant="ghost" onClick={onExpandToggleClick}><SidebarOpenIcon /></Button>
      );
    }
  }

  if (isMobile() && !isNewNote) {
    leftToolbarActions.push(
      <Button variant="ghost" onClick={() => window.history.back()}><BackIcon /></Button>
    );
  }

  if (isEditable) {
    rightToolbarActions.push(
      <Button variant="ghost" isDisabled={isSaveLoading} onClick={onSaveClick}>{saveButtonText}</Button>
    );
    rightToolbarActions.push(
      <Button variant="ghost" onClick={onEditCancelClick}>Cancel</Button>
    );
  } else {
    rightToolbarActions.push(
      <Button variant="ghost" onClick={onEditClick}>Edit</Button>
    );
  }

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


