import { h, useState } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import Button from "../../commons/components/Button.jsx";
import ButtonGroup from "../../commons/components/ButtonGroup.jsx";
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter, closeModal } from "../../commons/components/Modal.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import "./TagDetailModal.css";

export default function TagDetailModal({ tag, refreshTags }) {
  const [name, setName] = useState(tag.name);

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
        refreshTags();
        closeModal();
      });
  }

  function handleDeleteClick() {
    ApiClient.deleteTag(tag.tagId)
      .then(() => {
        refreshTags();
        closeModal();
        navigateTo("/notes/");
      });
  }

  function handleCancelClick() {
    closeModal();
  }


  return (
    <ModalBackdrop onClose={handleCancelClick} isCentered={true}>
      <ModalContainer className="tag-dialog">
        <ModalHeader title="Manage Tag" onClose={handleCancelClick} />
        <ModalContent>
          <p className="modal-description">Edit the tag name or <b>permanently delete</b> this tag. Deleting the tag will remove it from all notes.</p>
          <Input id="tag-name" label="Tag Name" type="text" placeholder="Name your Tag" value={name} hint="" error="" isDisabled={false} onChange={handleNameChange} />
        </ModalContent>
        <ModalFooter>
          <Button variant="danger" onClick={handleDeleteClick}>Delete</Button>
          <ButtonGroup>
            <Button onClick={handleCancelClick}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdateClick}>Update</Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  )
}