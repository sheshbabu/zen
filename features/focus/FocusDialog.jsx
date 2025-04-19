import { h } from "../../assets/preact.esm.js"
import Input from "../../commons/components/Input.jsx";

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

const CloseIcon = ({ className, onClick }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-x ${className}`}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);