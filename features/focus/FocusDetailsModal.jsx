import { h, render, useState } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import { CloseIcon } from "../../commons/components/Icon.jsx";
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";

export default function FocusDetailsModal({ mode, focusMode }) {
  const [name, setName] = useState(focusMode ? focusMode.name : "");
  const [tags, setTags] = useState(focusMode ? focusMode.tags : []);

  let title = "Create Focus";
  let buttonName = "Create";

  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      closeModal();
    }
  }

  function handleNameChange(e) {
    setName(e.target.value);
  }

  function handleAddTag(tag) {
    setTags((prevTags) => [...prevTags, tag]);
  }

  function handleRemoveTag(tag) {
    setTags((prevTags) => prevTags.filter(t => t.tag_id !== tag.tag_id));
  }

  function handleCreateClick() {
    let promise = null;

    const payload = {
      Name: name,
      Tags: tags
    };

    if (mode === "edit") {
      payload.focus_mode_id = focusMode.focus_mode_id;
      promise = ApiClient.updateFocusMode(payload);
    } else {
      promise = ApiClient.createFocusMode(payload);
    }

    promise
      .then(newFocusMode => {
        closeModal();
        if (mode === "create") {
          navigateTo(`/notes/?focus_id=${newFocusMode.focus_mode_id}`);
        }
      })
      .catch((error) => {
        console.error("Error creating focus mode:", error);
      });
  }

  function closeModal() {
    render(null, document.querySelector('.modal-root'));
  }

  if (mode === "edit") {
    title = "Edit Focus";
    buttonName = "Update";
  }

  return (
    <div class="modal-backdrop-container is-centered" onClick={handleBackdropClick}>
      <div class="modal-content-container focus-dialog">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <CloseIcon className="notes-editor-toolbar-button-close" onClick={closeModal} />
        </div>
        <div className="modal-content">
          <p>Define your Focus to concentrate on what matters most. Add tags to view only the relevant notes for this topic and work without distraction.</p>
          <Input id="focus-name" label="Focus Name" type="text" placeholder="Name your Focus" value={name} hint="" error="" isDisabled={false} onChange={handleNameChange} />
          <div className="form-field-container">
            <label htmlFor="focus-tags">Tags</label>
            <NotesEditorTags tags={tags} isEditable canCreateTag={false} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
          </div>
        </div>
        <div className="model-footer-container right-aligned">
          <div className="button" onClick={closeModal}>Cancel</div>
          <div className="button primary" onClick={handleCreateClick}>{buttonName}</div>
        </div>
      </div>
    </div>
  )
}