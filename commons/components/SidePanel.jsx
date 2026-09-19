import { h } from '../../assets/preact.esm.js';
import { useLayout } from '../contexts/LayoutContext.jsx';
import { useNotes } from '../contexts/NotesContext.jsx';
import navigateTo from '../utils/navigateTo.js';
import NotePreview from '../../features/notes/NotePreview.jsx';
import NotePreviewHeader from '../../features/notes/NotePreviewHeader.jsx';
import './SidePanel.css';

export default function SidePanel() {
  const { sidePanelNoteId, openSidePanelNote, closeSidePanel } = useLayout();
  const { handleNoteChange } = useNotes();

  const isOpen = sidePanelNoteId !== null;

  // Navigating closes the panel, so this doesn't clear it itself.
  function handleNavigateLink(linkedNoteId) {
    navigateTo(`/notes/${linkedNoteId}`);
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
      <div className="sidepanel-toolbar">
        <NotePreviewHeader onCloseClick={closeSidePanel} />
      </div>
      <div className="sidepanel-content">
        {preview}
      </div>
    </div>
  );
}
