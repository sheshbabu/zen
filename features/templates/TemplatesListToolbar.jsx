import { h } from "../../assets/preact.esm.js"
import { NewIcon } from '../../commons/components/Icon.jsx';
import Button from '../../commons/components/Button.jsx';
import "./TemplatesListToolbar.css";

export default function TemplatesListToolbar({ onNewTemplateClick, onToggleStats }) {
  return (
    <div className="templates-list-toolbar">
      <div className="templates-list-toolbar-left">
        <div onClick={onNewTemplateClick} title="New Template">
          <NewIcon />
        </div>
      </div>
      <div className="templates-list-toolbar-right">
        <Button variant="ghost" onClick={onToggleStats}>
          Stats
        </Button>
      </div>
    </div>
  );
}