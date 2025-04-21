import { h, render, useEffect, useState } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import { CloseIcon } from "../../commons/components/Icon.jsx";
import NotesEditorTags from "../tags/NotesEditorTags.jsx";

export default function FocusDialog() {
  const [name, setName] = useState("");
  const [tags, setTags] = useState([]);

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

  function handleCreateClick() {}

  function closeModal() {
    render(null, document.querySelector('.modal-root'));
  }

  return (
    <div class="modal-backdrop-container is-centered" onClick={handleBackdropClick}>
      <div class="modal-content-container focus-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Create Focus</h3>
            <CloseIcon className="notes-editor-toolbar-button-close" onClick={closeModal} />
          </div>
          <p>Define your Focus to concentrate on what matters most. Add tags to view only the relevant notes for this topic and work without distraction.</p>
          <Input id="focus-name" label="Focus Name" type="text" placeholder="Name your Focus" value={name} hint="" error="" isDisabled={false} onChange={handleNameChange}/>
          <div className="form-field-container">
            <label htmlFor="focus-tags">Tags</label>
            <NotesEditorTags tags={tags} isEditable onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
          </div>
        </div>
        <div className="model-footer-container">
          <div className="button" onClick={closeModal}>Cancel</div>
          <div className="button primary" onClick={handleCreateClick}>Create</div>
        </div>
      </div>
    </div>
  )
}