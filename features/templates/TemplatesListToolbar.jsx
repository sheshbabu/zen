import { h } from "../../assets/preact.esm.js"
import { NewIcon } from '../../commons/components/Icon.jsx';
import "./TemplatesListToolbar.css";

export default function TemplatesListToolbar({ onNewTemplateClick }) {
  return (
    <div className="templates-list-toolbar">
      <div className="templates-list-toolbar-left">
        <div onClick={onNewTemplateClick} title="New Template">
          <NewIcon />
        </div>
      </div>
    </div>
  );
}