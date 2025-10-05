import { h } from '../../assets/preact.esm.js';
import { BackIcon, TrashIcon, ZoomInIcon, ZoomOutIcon, SidebarOpenIcon, SidebarCloseIcon } from '../../commons/components/Icon.jsx';
import './CanvasToolbar.css';

export default function CanvasToolbar({ onBack, onDelete, onZoomIn, onZoomOut, onZoomReset, zoomLevel, onToggleSidebar, isSidebarOpen }) {
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
        <button className="canvas-toolbar-button" onClick={onZoomOut}>
          <ZoomOutIcon />
        </button>
        <button className="canvas-toolbar-button canvas-toolbar-zoom-level" onClick={onZoomReset}>
          {Math.round(zoomLevel * 100)}%
        </button>
        <button className="canvas-toolbar-button" onClick={onZoomIn}>
          <ZoomInIcon />
        </button>
        <div className="canvas-toolbar-divider"></div>
        <button className={`canvas-toolbar-button ${isSidebarOpen ? 'active' : ''}`} onClick={onToggleSidebar}>
          {isSidebarOpen ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
        </button>
      </div>
    </div>
  );
}
