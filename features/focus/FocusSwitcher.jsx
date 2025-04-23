import { h, render, useEffect, useState } from "../../assets/preact.esm.js"
import FocusDetailsModal from './FocusDetailsModal.jsx';
import { ArrowDownIcon, PencilIcon, NewIcon } from "../../commons/components/Icon.jsx";
import navigateTo from "../../commons/utils/navigateTo.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";

export default function FocusSwitcher({ focusModes }) {
  if (focusModes.length === 0) {
    focusModes = [{ focus_mode_id: 0, name: "Everything" }];
  }

  const [selectedFocusMode, setSelectedFocusMode] = useState(focusModes[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchParams = useSearchParams();
  const selectedFocusId = searchParams.get("focus_id");

  useEffect(() => {
    setSelectedFocusMode(focusModes.find(focusMode => focusMode.focus_mode_id === parseInt(selectedFocusId, 10)) || focusModes[0]);
  }, [selectedFocusId, focusModes]);

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleFocusModeClick(focusMode) {
    let to = "/notes/"
    if (focusMode.focus_mode_id !== 0) {
      to = `/notes/?focus_id=${focusMode.focus_mode_id}`
    }
    navigateTo(to);
    setIsDropdownOpen(false);
  }

  function handleAddNewClick() {
    setIsDropdownOpen(false);
    render(<FocusDetailsModal mode="create"/>, document.querySelector('.modal-root'));
  }

  function handleEditClick(e, focusMode) {
    e.stopPropagation();
    setIsDropdownOpen(false);
    render(<FocusDetailsModal mode="edit" focusMode={focusMode}/>, document.querySelector('.modal-root'));
  }

  const items = focusModes.map(focusMode => {
    let editIcon = null;
    if (focusMode.focus_mode_id !== 0) {
      editIcon = <PencilIcon onClick={e => handleEditClick(e, focusMode)}/>
    }
    return (
      <li key={focusMode.focus_mode_id} className="dropdown-option" onClick={() => handleFocusModeClick(focusMode)}>
        {focusMode.name}
        {editIcon}
      </li>
    )
  });
  items.push(<li className="dropdown-option" onClick={handleAddNewClick}>Add new...</li>);

  return (
    <div className="sidebar-focus-switcher">
      <div className="dropdown-button button" onClick={handleDropdownClick}>
        {selectedFocusMode.name}
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

