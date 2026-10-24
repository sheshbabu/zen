import { h, useRef } from '../../assets/preact.esm.js';
import { useLayout } from '../contexts/LayoutContext.jsx';
import { useNotes } from '../contexts/NotesContext.jsx';
import navigateTo from '../utils/navigateTo.js';
import NotePreview from '../../features/notes/NotePreview.jsx';
import NotePreviewHeader from '../../features/notes/NotePreviewHeader.jsx';
import SidePanelWidthPreferences from '../preferences/SidePanelWidthPreferences.js';
import './SidePanel.css';

export default function SidePanel() {
  const { sidePanelNoteId, openSidePanelNote, closeSidePanel } = useLayout();
  const { handleNoteChange } = useNotes();

  const panelRightRef = useRef(0);
  const resizeGrabOffsetRef = useRef(0);
  const resizedWidthRef = useRef(null);

  const isOpen = sidePanelNoteId !== null;

  // Navigating closes the panel, so this doesn't clear it itself.
  function handleNavigateLink(linkedNoteId) {
    navigateTo(`/notes/${linkedNoteId}`);
  }

  function handleResizePointerDown(e) {
    // Without this, the browser can start a text selection or a link drag that cancels the resize.
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    const panel = e.target.parentElement;
    const panelRect = panel.getBoundingClientRect();
    panelRightRef.current = panelRect.right;
    resizeGrabOffsetRef.current = e.clientX - panelRect.left;
    resizedWidthRef.current = null;
    // The open and close width animation would make the panel lag behind the pointer.
    panel.classList.add('is-resizing');
  }

  function handleResizePointerMove(e) {
    if (e.target.hasPointerCapture(e.pointerId)) {
      const width = panelRightRef.current - (e.clientX - resizeGrabOffsetRef.current);
      resizedWidthRef.current = SidePanelWidthPreferences.applyWidth(width);
    }
  }

  // Capture is lost on pointerup and also when the browser cancels the drag, so cleanup happens here to cover both.
  function handleResizeLostPointerCapture(e) {
    e.target.parentElement.classList.remove('is-resizing');
    if (resizedWidthRef.current !== null) {
      SidePanelWidthPreferences.setWidth(resizedWidthRef.current);
    }
  }

  // The toolbar and content stay mounted so the container can animate its width on open/close.
  let preview = null;
  if (isOpen === true) {
    preview = (
      <NotePreview
        key={sidePanelNoteId}
        noteId={sidePanelNoteId}
        onOpenLink={openSidePanelNote}
        onNavigateLink={handleNavigateLink}
        onNoteChange={handleNoteChange}
      />
    );
  }

  return (
    <div className={`sidepanel-container${isOpen ? ' is-open' : ''}`}>
      <div className="sidepanel-resize-handle" onPointerDown={handleResizePointerDown} onPointerMove={handleResizePointerMove} onLostPointerCapture={handleResizeLostPointerCapture}></div>
      <div className="sidepanel-toolbar">
        <NotePreviewHeader onCloseClick={closeSidePanel} />
      </div>
      <div className="sidepanel-content">
        {preview}
      </div>
    </div>
  );
}
