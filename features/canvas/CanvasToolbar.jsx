import { h } from '../../assets/preact.esm.js';
import { BackIcon, TrashIcon, ZoomInIcon, ZoomOutIcon, SidebarOpenIcon, SidebarCloseIcon, AlignStartHorizontalIcon, AlignStartVerticalIcon, AlignCenterHorizontalIcon, AlignCenterVerticalIcon, AlignEndHorizontalIcon, AlignEndVerticalIcon } from '../../commons/components/Icon.jsx';
import './CanvasToolbar.css';

export default function CanvasToolbar({ onBack, onDelete, onZoom, zoomLevel, onToggleSidebar, isSidebarOpen, onAlign, hasMultiSelection }) {
  return (
    <div className="canvas-toolbar">
      <div className="canvas-toolbar-left">
        <button className="canvas-toolbar-button" onClick={onBack}>
          <BackIcon />
        </button>
        <h1 className="canvas-toolbar-title">Canvas</h1>
      </div>
      <div className="canvas-toolbar-right">
        <button className="canvas-toolbar-button" onClick={onDelete}>
          <TrashIcon />
        </button>
        <div className="canvas-toolbar-divider"></div>
        <div className="canvas-toolbar-alignment-group">
          <button className="canvas-toolbar-button" onClick={() => onAlign('left')} disabled={hasMultiSelection !== true} title="Align Left">
            <AlignStartVerticalIcon />
          </button>
          <button className="canvas-toolbar-button" onClick={() => onAlign('top')} disabled={hasMultiSelection !== true} title="Align Top">
            <AlignStartHorizontalIcon />
          </button>
          <button className="canvas-toolbar-button" onClick={() => onAlign('bottom')} disabled={hasMultiSelection !== true} title="Align Bottom">
            <AlignEndHorizontalIcon />
          </button>
          <button className="canvas-toolbar-button" onClick={() => onAlign('right')} disabled={hasMultiSelection !== true} title="Align Right">
            <AlignEndVerticalIcon />
          </button>
          <button className="canvas-toolbar-button" onClick={() => onAlign('center-horizontal')} disabled={hasMultiSelection !== true} title="Align Center Horizontal">
            <AlignCenterHorizontalIcon />
          </button>
          <button className="canvas-toolbar-button" onClick={() => onAlign('center-vertical')} disabled={hasMultiSelection !== true} title="Align Center Vertical">
            <AlignCenterVerticalIcon />
          </button>
        </div>
        <div className="canvas-toolbar-divider"></div>
        <button className="canvas-toolbar-button" onClick={() => onZoom('in')}>
          <ZoomInIcon />
        </button>
        <button className="canvas-toolbar-button canvas-toolbar-zoom-level" onClick={() => onZoom('reset')}>
          {Math.round(zoomLevel * 100)}%
        </button>
        <button className="canvas-toolbar-button" onClick={() => onZoom('out')}>
          <ZoomOutIcon />
        </button>

        <div className="canvas-toolbar-divider"></div>
        <button className={`canvas-toolbar-button ${isSidebarOpen ? 'active' : ''}`} onClick={onToggleSidebar}>
          {isSidebarOpen ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
        </button>
      </div>
    </div>
  );
}
