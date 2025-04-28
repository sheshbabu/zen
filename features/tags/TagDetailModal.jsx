import { h, render, useState } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import { CloseIcon } from "../../commons/components/Icon.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";

export default function TagDetailModal({ tag }) {
  const [name, setName] = useState(tag.name);

  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      closeModal();
    }
  }

  function handleNameChange(e) {
    setName(e.target.value);
  }

  function handleUpdateClick() {
    const payload = {
      tagId: tag.tagId,
      name: name
    };

    ApiClient.updateTag(payload)
      .then(() => {
        closeModal();
        navigateTo(`/notes/?tagId=${tag.tagId}`);
      })
      .catch((error) => {
        console.error("Error updating tag:", error);
      });
  }

  function handleDeleteClick() {
    ApiClient.deleteTag(tag.tagId)
      .then(() => {
        closeModal();
        navigateTo("/notes/");
      })
      .catch((error) => {
        console.error("Error deleting tag:", error);
      });
  }

  function closeModal() {
    render(null, document.querySelector('.modal-root'));
  }

  return (
    <div class="modal-backdrop-container is-centered" onClick={handleBackdropClick}>
      <div class="modal-content-container tag-dialog">
        <div className="modal-header">
          <h3 className="modal-title">Manage Tag</h3>
          <CloseIcon className="notes-editor-toolbar-button-close" onClick={closeModal} />
        </div>
        <div className="modal-content">
          <p>Edit the tag name or <b>permanently delete</b> this tag. Deleting the tag will remove it from all notes.</p>
          <Input id="tag-name" label="Tag Name" type="text" placeholder="Name your Tag" value={name} hint="" error="" isDisabled={false} onChange={handleNameChange} />
        </div>
        <div className="model-footer-container">
          <div className="button danger" onClick={handleDeleteClick}>Delete</div>
          <div className="button-group">
            <div className="button" onClick={closeModal}>Cancel</div>
            <div className="button primary" onClick={handleUpdateClick}>Update</div>
          </div>
        </div>
      </div>
    </div>
  )
}