import { h, render, useState } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import Button from "../../commons/components/Button.jsx";
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent } from "../../commons/components/Modal.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import "./FocusDetailsModal.css";

export default function FocusDetailsModal({ mode, focusMode, refreshFocusModes, refreshTags }) {
  const [name, setName] = useState(focusMode ? focusMode.name : "");
  const [tags, setTags] = useState(focusMode ? focusMode.tags : []);

  let title = "Create Focus";
  let buttonName = "Create";

  function handleNameChange(e) {
    setName(e.target.value);
  }

  function handleAddTag(tag) {
    setTags((prevTags) => [...prevTags, tag]);
    refreshTags();
  }

  function handleRemoveTag(tag) {
    setTags((prevTags) => prevTags.filter(t => t.tagId !== tag.tagId));
    refreshTags();
  }

  function handleCreateClick() {
    let promise = null;

    const payload = {
      name: name,
      tags: tags
    };

    if (mode === "edit") {
      payload.focusId = focusMode.focusId;
      promise = ApiClient.updateFocusMode(payload);
    } else {
      promise = ApiClient.createFocusMode(payload);
    }

    promise
      .then(newFocusMode => {
        refreshFocusModes();
        closeModal();
        if (mode === "create") {
          navigateTo(`/notes/?focusId=${newFocusMode.focusId}`);
        }
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
    <ModalBackdrop onClose={closeModal} isCentered={true}>
      <ModalContainer className="focus-dialog">
        <ModalHeader title={title} onClose={closeModal} />
        <ModalContent>
          <p className="modal-description">Define your Focus to concentrate on what matters most. Add tags to view only the relevant notes for this topic and work without distraction.</p>
          <Input id="focus-name" label="Focus Name" type="text" placeholder="Name your Focus" value={name} hint="" error="" isDisabled={false} onChange={handleNameChange} />
          <div className="form-field-container">
            <label htmlFor="focus-tags">Tags</label>
            <NotesEditorTags tags={tags} isEditable canCreateTag={false} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
          </div>
        </ModalContent>
        <div className="model-footer-container right-aligned">
          <Button onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateClick}>{buttonName}</Button>
        </div>
      </ModalContainer>
    </ModalBackdrop>
  )
}