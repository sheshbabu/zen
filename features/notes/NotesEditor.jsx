import { h, render, useState, useRef, useEffect } from "../../assets/preact.esm.js"
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
  const [title, setTitle] = useState(selectedNote?.Title || "");
  const [content, setContent] = useState(selectedNote?.Content || "");
  const [tags, setTags] = useState(selectedNote?.Tags || []);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const titleRef = useRef(null);
  const textareaRef = useRef(null);

  let contentArea = null;

  useEffect(() => {
    if (isNewNote || (isEditable && titleRef.current?.textContent === "")) {
      titleRef.current.focus();
    }

    function handleKeyDown(e) {
      const isTextAreaFocused = document.activeElement.className == "notes-editor-textarea";

      if (!isTextAreaFocused && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
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
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    handleTextAreaHeight();
  }, [content, isEditable]);

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

  function handleSaveClick() {
    const note = {
      Title: title,
      Content: content,
      Tags: tags,
    };

    let promise = null;

    if (isNewNote) {
      promise = ApiClient.createNote(note);
    } else {
      promise = ApiClient.updateNote(selectedNote.NoteID, note);
    }

    promise
      .then(note => {
        setIsEditable(false);
        setAttachments([]); // reset

        if (isNewNote) {
          navigateTo(`/notes/${note.NoteID}`, true);
        }

        onChange();
      })
      .catch(e => {
        console.error('Error saving note:', e);
      });
  }

  function handleEditClick() {
    setIsEditable(true);
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
    setTags((prevTags) => prevTags.filter(t => t.tag_id !== tag.tag_id));
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
    ApiClient.deleteNote(selectedNote.NoteID)
      .then(() => {
        handleDeleteCloseClick();
        navigateTo("/", true);
        onChange();
      })
      .catch(e => {
        console.error('Error deleting note:', e);
      });
  }

  function handleDeleteCloseClick() {
    render(null, document.querySelector('.modal-root'));
  }

  function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    ApiClient.uploadImage(formData)
      .then(result => {
        const imageUrl = `![](/images/${result.filename})`;
        insertAtCursor(imageUrl);
      })
      .catch(error => {
        console.error('Error uploading image:', error);
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

    const newPosition = startPos + text.length;
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
      <div className="notes-editor-header">
        <div className="notes-editor-title" contentEditable={isEditable} ref={titleRef} onBlur={handleTitleChange} dangerouslySetInnerHTML={{ __html: title }} />
        <Toolbar isEditable={isEditable} isFloating={isFloating} onSaveClick={handleSaveClick} onEditClick={handleEditClick} onCloseClick={handleCloseClick} onDeleteClick={handleDeleteClick} />
      </div>
      <NotesEditorTags tags={tags} isEditable={isEditable} canCreateTag onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
      <div className={`notes-editor-image-dropzone ${isDraggingOver ? "dragover" : ""}`} onDrop={handleImageDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        Drag and drop images here...
      </div>
      <div className="notes-editor-image-attachment-preview">{imagePreviewItems}</div>
      <div className="notes-editor-content">
        {contentArea}
      </div>
    </div>
  );
}

function Toolbar({ isEditable, isFloating, onSaveClick, onEditClick, onCloseClick, onDeleteClick }) {
  const actions = [];
  const menuActions = [];

  if (isFloating) {
    actions.push(
      <div className="ghost-button" onClick={onCloseClick}>Close</div>
    );
  }

  if (isEditable) {
    actions.push(
      <div className="ghost-button" onClick={onSaveClick}>Save</div>
    );
  } else {
    actions.push(
      <div className="ghost-button" onClick={onEditClick}>Edit</div>
    );
    menuActions.push(
      <div style="width: 80px;" onClick={onDeleteClick}>Delete</div>
    );
  }

  return (
    <div className="notes-editor-toolbar">
      {actions}
      <DropdownMenu actions={menuActions} />
    </div>
  );
}


