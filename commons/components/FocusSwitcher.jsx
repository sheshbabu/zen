import { h, useState, render } from '../../dependencies/preact.esm.js';
import { useAppContext } from '../../AppContext.jsx';
import FocusDialog from './FocusDialog.jsx';

export default function FocusSwitcher() {
  const { appContext } = useAppContext();
  const { focusModes } = appContext;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleAddNewClick() {
    setIsDropdownOpen(false);
    render(<FocusDialog onCloseClick={handleFocusDialogCloseClick}/>, document.querySelector('.dialog-container'));
  }

  function handleFocusDialogCloseClick() {
    render(null, document.querySelector('.dialog-container'));
  }

  const items = focusModes.map(mode => <li className="dropdown-option">{mode.Name}</li>);
  items.push(<li className="dropdown-option" onClick={handleAddNewClick}>Add new...</li>);

  return (
    <div className="sidebar-focus-switcher">
      <div className="dropdown-button button" onClick={handleDropdownClick}>
        All Notes
        <ArrowDownIcon />
      </div>
      <div className={`dropdown-container ${isDropdownOpen ? 'open' : ''}`}>
        <ul className="dropdown-menu">
          {items}
        </ul>
      </div>
    </div>
  )
}

function ArrowDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}