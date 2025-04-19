import { h, useState, render } from "../../assets/preact.esm.js"
import FocusDialog from './FocusDialog.jsx';
import { ArrowDownIcon } from "../../commons/components/Icon.jsx";

export default function FocusSwitcher({ focusModes }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleAddNewClick() {
    setIsDropdownOpen(false);
    render(<FocusDialog onCloseClick={handleFocusDialogCloseClick} />, document.querySelector('.dialog-container'));
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

