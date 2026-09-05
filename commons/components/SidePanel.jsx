import { h } from '../../assets/preact.esm.js';
import { useLayout } from '../contexts/LayoutContext.jsx';
import Button from './Button.jsx';
import { CloseIcon } from './Icon.jsx';
import './SidePanel.css';

export default function SidePanel() {
  const { sidePanelContent, setSidePanelContent } = useLayout();

  function handleCloseClick() {
    setSidePanelContent(null);
  }

  const isOpen = sidePanelContent !== null;

  return (
    <div className={`sidepanel-container${isOpen ? ' is-open' : ''}`}>
      <div className="sidepanel-toolbar">
        <Button variant="ghost" onClick={handleCloseClick}>
          <CloseIcon />
        </Button>
      </div>
      <div className="sidepanel-content">
        {sidePanelContent}
      </div>
    </div>
  );
}
