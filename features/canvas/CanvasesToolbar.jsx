import { h } from "../../assets/preact.esm.js"
import { NewIcon } from '../../commons/components/Icon.jsx';
import "./CanvasesToolbar.css";

export default function CanvasesToolbar({ onNewCanvasClick }) {
  return (
    <div className="canvases-list-toolbar">
      <div className="canvases-list-toolbar-left">
        <button onClick={onNewCanvasClick} title="New Canvas">
          <NewIcon />
        </button>
      </div>
    </div>
  );
}
