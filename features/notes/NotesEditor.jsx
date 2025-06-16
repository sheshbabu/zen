import { h, render, useState, useRef, useEffect, useCallback } from "../../assets/preact.esm.js"
import ApiClient from '../../commons/http/ApiClient.js';
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import renderMarkdown from '../../commons/utils/renderMarkdown.js';
import navigateTo from '../../commons/utils/navigateTo.js';
import NoteDeleteModal from './NoteDeleteModal.jsx';
import DropdownMenu from '../../commons/components/DropdownMenu.jsx';

export default function NotesEditor({ selectedNote, isNewNote, isFloating, onChange }) {
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
        setAttachments([]); // reset

        if (isNewNote) {
          navigateTo(`/notes/${note.noteId}`, true);
        }

        onChange();
      })
      .finally(() => {
        setIsSaveLoading(false);
      });
  }, [content, tags, isNewNote, selectedNote, onChange]);

  const handleKeyDown = useCallback(e => {
    const isTextAreaFocused = document.activeElement.className == "notes-editor-textarea";

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isEditable) {
        handleSaveClick();
      } else {
        handleEditClick();
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (isFloating) {
        handleCloseClick();
      }
    }

    if (isTextAreaFocused && e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      insertAtCursor('  ');
    }

    if (isTextAreaFocused && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
      e.preventDefault();
      formatSelectedText("highlight");
    }

    if (isTextAreaFocused && (e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      formatSelectedText("bold");
    }
  }, [isEditable, isFloating, handleSaveClick]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

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
      navigateTo("/", true);
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

  function handlePaste(e) {
    const items = e.clipboardData.items;

    // Ignore if it doesn't contain any images
    if (Array.from(items).every(item => item.type.indexOf('image') === -1)) {
      return;
    }

    e.preventDefault();
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        setAttachments((prevAttachments) => [...prevAttachments, file]);
        uploadImage(file);
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDraggingOver(false);
  }

  function handleImageDrop(e) {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    processImageFiles(files);
  }

  function handleDropzoneClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e) {
    const files = e.target.files;
    if (files) {
      processImageFiles(files);
      e.target.value = '';
    }
  }

  function processImageFiles(files) {
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        setAttachments((prevAttachments) => [...prevAttachments, file]);
        uploadImage(file);
      }
    }
  }

  function handleCloseClick() {
    navigateTo("/", true);
  }

  function handleDeleteClick() {
    render(
      <NoteDeleteModal
        onDeleteClick={handleDeleteConfirmClick}
        onCloseClick={handleDeleteCloseClick}
      />,
      document.querySelector('.modal-root'));
  }

  function handleDeleteConfirmClick() {
    ApiClient.deleteNote(selectedNote.noteId)
      .then(() => {
        handleDeleteCloseClick();
        navigateTo("/", true);
        onChange();
      });
  }

  function handleDeleteCloseClick() {
    render(null, document.querySelector('.modal-root'));
  }

  function handleArchiveClick() {
    ApiClient.archiveNote(selectedNote.noteId)
      .then(() => {
        onChange();
      });
  }

  function handleUnarchiveClick() {
    ApiClient.unarchiveNote(selectedNote.noteId)
      .then(() => {
        onChange();
      });
  }

  function handleRestoreClick() {
    ApiClient.restoreNote(selectedNote.noteId)
      .then(() => {
        onChange();
      });
  }

  function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    ApiClient.uploadImage(formData)
      .then(result => {
        const imageUrl = `![](/images/${result.filename})`;
        insertAtCursor(imageUrl);
      });
  }

  function insertAtCursor(text) {
    if (textareaRef.current === null) {
      return;
    }

    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, startPos);
    const afterText = textarea.value.substring(endPos);

    setContent(beforeText + text + afterText);

    // Use setTimeout to ensure cursor position is set after DOM update
    const newPosition = startPos + text.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  }

  function formatSelectedText(format) {
    if (textareaRef.current === null) {
      return;
    }

    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, startPos);
    const afterText = textarea.value.substring(endPos);
    const selectedText = textarea.value.substring(startPos, endPos);
    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "highlight":
        formattedText = `==${selectedText}==`;
        break;
    }

    setContent(beforeText + formattedText + afterText);

    const newPosition = startPos + formattedText.length;
    textarea.selectionStart = newPosition;
    textarea.selectionEnd = newPosition;
    textarea.focus();
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
      <div className="notes-editor-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    );
  }

  const imagePreviewItems = attachments.map((file, index) => {
    const imageUrl = URL.createObjectURL(file);
    return (
      <img src={imageUrl} alt={`Attachment ${index}`} />
    );
  });

  // TODO: remove "is-editable" CSS and use JS
  return (
    <div className={`notes-editor ${isEditable ? "is-editable" : ""}`} tabIndex="0" onPaste={handlePaste}>
      <Toolbar
        note={selectedNote}
        isNewNote={isNewNote}
        isEditable={isEditable}
        isFloating={isFloating}
        isSaveLoading={isSaveLoading}
        onSaveClick={handleSaveClick}
        onEditClick={handleEditClick}
        onEditCancelClick={handleEditCancelClick}
        onCloseClick={handleCloseClick}
        onDeleteClick={handleDeleteClick}
        onArchiveClick={handleArchiveClick}
        onUnarchiveClick={handleUnarchiveClick}
        onRestoreClick={handleRestoreClick}
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
      <div className="notes-editor-content">
        {contentArea}
      </div>
    </div>
  );
}

function Toolbar({ note, isNewNote, isEditable, isFloating, isSaveLoading, onSaveClick, onEditClick, onEditCancelClick, onCloseClick, onDeleteClick, onArchiveClick, onUnarchiveClick, onRestoreClick }) {
  const actions = [];
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
    actions.push(
      <div className="ghost-button" onClick={onCloseClick}>Close</div>
    );
  }

  if (isEditable) {
    actions.push(
      <div className="ghost-button" onClick={onSaveClick}>{saveButtonText}</div>
    );
    actions.push(
      <div className="ghost-button" onClick={onEditCancelClick}>Cancel</div>
    );
  } else {
    actions.push(
      <div className="ghost-button" onClick={onEditClick}>Edit</div>
    );
  }

  if (!isNewNote) {
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
      {actions}
      <DropdownMenu actions={menuActions} />
    </div>
  );
}


