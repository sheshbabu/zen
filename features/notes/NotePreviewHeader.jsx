import { h } from '../../assets/preact.esm.js';
import Button from '../../commons/components/Button.jsx';
import { CloseIcon } from '../../commons/components/Icon.jsx';
import './NotePreviewHeader.css';

export default function NotePreviewHeader({ onCloseClick }) {
  return (
    <div className="note-preview-header">
      <div className="note-preview-header-actions">
        <Button variant="ghost" onClick={onCloseClick}>
          <CloseIcon />
        </Button>
      </div>
    </div>
  );
}
