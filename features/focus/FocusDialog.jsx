import { h } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import { CloseIcon } from "../../commons/components/Icon.jsx";

export default function FocusDialog({ onCloseClick }) {
  return (
    <div class="modal-backdrop-container">
      <div class="modal-content-container focus-dialog">
        <div className="modal-content">
          <CloseIcon className="notes-editor-toolbar-button-close" onClick={onCloseClick} />
          <Input id="focus-name" label="Focus Name" type="text" placeholder="Enter focus name" value="" hint="" error="" isDisabled={false} />
        </div>
      </div>
    </div>
  )
}