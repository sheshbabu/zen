import { h } from '../../assets/preact.esm.js';
import { TrashIcon, AlignStartHorizontalIcon, AlignStartVerticalIcon, AlignCenterHorizontalIcon, AlignCenterVerticalIcon, AlignEndHorizontalIcon, AlignEndVerticalIcon } from '../../commons/components/Icon.jsx';
import './CanvasSelectionBar.css';

export default function CanvasSelectionBar({ rect, selectionCount, onDelete, onAlign }) {
  if (selectionCount === 0 || rect === undefined || rect === null) {
    return null;
  }

  const gap = 12;
  const estimatedBarHeight = 42;

  let top = rect.y - gap;
  let isBelow = false;

  if (top - estimatedBarHeight < gap) {
    top = rect.y + rect.height + gap;
    isBelow = true;
  }

  const left = rect.x + rect.width / 2;

  let alignmentGroup = null;
  if (selectionCount >= 2) {
    alignmentGroup = (
      <div className="canvas-selection-bar-group">
        <button className="canvas-selection-bar-button" onClick={() => onAlign('left')} title="Align Left">
          <AlignStartVerticalIcon />
        </button>
        <button className="canvas-selection-bar-button" onClick={() => onAlign('top')} title="Align Top">
          <AlignStartHorizontalIcon />
        </button>
        <button className="canvas-selection-bar-button" onClick={() => onAlign('bottom')} title="Align Bottom">
          <AlignEndHorizontalIcon />
        </button>
        <button className="canvas-selection-bar-button" onClick={() => onAlign('right')} title="Align Right">
          <AlignEndVerticalIcon />
        </button>
        <button className="canvas-selection-bar-button" onClick={() => onAlign('center-horizontal')} title="Align Center Horizontal">
          <AlignCenterHorizontalIcon />
        </button>
        <button className="canvas-selection-bar-button" onClick={() => onAlign('center-vertical')} title="Align Center Vertical">
          <AlignCenterVerticalIcon />
        </button>
      </div>
    );
  }

  let countLabel = null;
  if (selectionCount >= 2) {
    countLabel = <span className="canvas-selection-bar-count">{selectionCount} selected</span>;
  }

  return (
    <div className={`canvas-selection-bar ${isBelow ? 'is-below' : ''}`} style={`top: ${top}px; left: ${left}px;`}>
      {countLabel}
      {alignmentGroup}
      <div className="canvas-selection-bar-group">
        <button className="canvas-selection-bar-button is-destructive" onClick={onDelete} title="Delete (Del)">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
