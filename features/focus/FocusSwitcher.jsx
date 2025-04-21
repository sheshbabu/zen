import { h, render, useEffect, useState } from "../../assets/preact.esm.js"
import FocusCreateModal from './FocusCreateModal.jsx';
import { ArrowDownIcon } from "../../commons/components/Icon.jsx";
import navigateTo from "../../commons/utils/navigateTo.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";

export default function FocusSwitcher({ focusModes }) {
  if (focusModes.length === 0) {
    focusModes = [{ FocusModeID: 0, Name: "All Notes" }];
  }

  const [selectedFocusMode, setSelectedFocusMode] = useState(focusModes[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchParams = useSearchParams();
  const selectedFocusId = searchParams.get("focus_id");

  useEffect(() => {
    setSelectedFocusMode(focusModes.find(focusMode => focusMode.FocusModeID === parseInt(selectedFocusId, 10)) || focusModes[0]);
  }, [selectedFocusId]);

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleFocusModeClick(focusMode) {
    let to = "/notes/"
    if (focusMode.FocusModeID !== 0) {
      to = `/notes/?focus_id=${focusMode.FocusModeID}`
    }
    navigateTo(to);
    setIsDropdownOpen(false);
  }

  function handleAddNewClick() {
    setIsDropdownOpen(false);
    render(<FocusCreateModal />, document.querySelector('.modal-root'));
  }

  const items = focusModes.map(focusMode => <li className="dropdown-option" onClick={() => handleFocusModeClick(focusMode)}>{focusMode.Name}</li>);
  items.push(<li className="dropdown-option" onClick={handleAddNewClick}>Add new...</li>);

  return (
    <div className="sidebar-focus-switcher">
      <div className="dropdown-button button" onClick={handleDropdownClick}>
        {selectedFocusMode.Name}
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

