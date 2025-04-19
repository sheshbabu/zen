import { h } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";
import { CloseIcon } from "../../commons/components/Icon.jsx";

export default function FocusDialog({ onCloseClick }) {
  return (
    <div class="focus-dialog-container">
      <div class="focus-dialog">
        <CloseIcon className="notes-editor-toolbar-button-close" onClick={onCloseClick} />
        <Input id="focus-name" label="Focus Name" type="text" placeholder="Enter focus name" value="" hint="" error="" isDisabled={false} />
      </div>
    </div>
  )
}