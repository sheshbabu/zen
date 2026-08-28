import { h, useState, useRef, useEffect } from '../../assets/preact.esm.js';
import { BackIcon, ZoomInIcon, ZoomOutIcon, SidebarOpenIcon, SidebarCloseIcon, HandIcon, MousePointerIcon, StickyNoteIcon } from '../../commons/components/Icon.jsx';
import SegmentedControl from '../../commons/components/SegmentedControl.jsx';
import './CanvasToolbar.css';

export default function CanvasToolbar({ onBack, title, onTitleChange, onZoom, zoomLevel, onToggleSidebar, isSidebarOpen, onTogglePanMode, isPanMode, onAddStickyNote }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isEditingTitle === true && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  function handleTitleClick() {
    setEditTitle(title || '');
    setIsEditingTitle(true);
  }

  function handleTitleBlur() {
    setIsEditingTitle(false);
    const trimmed = editTitle.trim();
    if (trimmed !== '' && trimmed !== title) {
      onTitleChange(trimmed);
    }
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleInputRef.current.blur();
    } else if (e.key === 'Escape') {
      setEditTitle(title || '');
      setIsEditingTitle(false);
    }
  }

  let titleElement;
  if (isEditingTitle === true) {
    titleElement = (
      <input
        ref={titleInputRef}
        className="canvas-toolbar-title-input"
        value={editTitle}
        onInput={(e) => setEditTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
      />
    );
  } else {
    titleElement = (
      <h1 className="canvas-toolbar-title" onClick={handleTitleClick}>
        {title || 'Untitled Canvas'}
      </h1>
    );
  }

  const modeOptions = [
    { value: 'select', label: <MousePointerIcon /> },
    { value: 'pan', label: <HandIcon /> },
  ];

  const mode = isPanMode ? 'pan' : 'select';

  function handleModeChange(newMode) {
    const isPanSelected = newMode === 'pan';
    if (isPanSelected !== isPanMode) {
      onTogglePanMode();
    }
  }

  return (
    <div className="canvas-toolbar">
      <div className="canvas-toolbar-left">
        <button className="canvas-toolbar-button" onClick={onBack}>
          <BackIcon />
        </button>
        {titleElement}
      </div>
      <div className="canvas-toolbar-right">
        <button className="canvas-toolbar-button" onClick={onAddStickyNote} title="Add Sticky Note">
          <StickyNoteIcon />
        </button>
        <div className="canvas-toolbar-divider"></div>
        <SegmentedControl options={modeOptions} value={mode} onChange={handleModeChange} />
        <div className="canvas-toolbar-divider"></div>
        <button className="canvas-toolbar-button" onClick={() => onZoom('out')} title="Zoom Out">
          <ZoomOutIcon />
        </button>
        <button className="canvas-toolbar-button canvas-toolbar-zoom-level" onClick={() => onZoom('reset')} title="Reset Zoom">
          {Math.round(zoomLevel * 100)}%
        </button>
        <button className="canvas-toolbar-button" onClick={() => onZoom('in')} title="Zoom In">
          <ZoomInIcon />
        </button>
        <div className="canvas-toolbar-divider"></div>
        <button className={`canvas-toolbar-button ${isSidebarOpen ? 'active' : ''}`} onClick={onToggleSidebar} title="Sidebar">
          {isSidebarOpen ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
        </button>
      </div>
    </div>
  );
}
