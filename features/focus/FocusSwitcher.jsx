import { h, render, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import FocusDetailsModal from './FocusDetailsModal.jsx';
import { ArrowDownIcon, PencilIcon } from "../../commons/components/Icon.jsx";
import Button from "../../commons/components/Button.jsx";
import navigateTo from "../../commons/utils/navigateTo.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";

export default function FocusSwitcher({ focusModes }) {
  if (focusModes.length === 0) {
    focusModes = [{ focusId: 0, name: "Everything" }];
  }

  const [selectedFocusMode, setSelectedFocusMode] = useState(focusModes[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const searchParams = useSearchParams();
  const selectedFocusId = searchParams.get("focusId");

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    setSelectedFocusMode(focusModes.find(focusMode => focusMode.focusId === parseInt(selectedFocusId, 10)) || focusModes[0]);
  }, [selectedFocusId, focusModes]);

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleFocusModeClick(focusMode) {
    let to = "/notes/"
    if (focusMode.focusId !== 0) {
      to = `/notes/?focusId=${focusMode.focusId}`
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
    if (focusMode.focusId !== 0) {
      editIcon = <PencilIcon onClick={e => handleEditClick(e, focusMode)}/>
    }
    return (
      <li key={focusMode.focusId} className="dropdown-option" onClick={() => handleFocusModeClick(focusMode)}>
        {focusMode.name}
        {editIcon}
      </li>
    )
  });
  items.push(<li className="dropdown-option" onClick={handleAddNewClick}>Add new...</li>);

  return (
    <div ref={dropdownRef} className="sidebar-focus-switcher">
      <Button className="dropdown-button" onClick={handleDropdownClick}>
        {selectedFocusMode.name}
        <ArrowDownIcon />
      </Button>
      <div className={`dropdown-container ${isDropdownOpen ? 'open' : ''}`}>
        <ul className="dropdown-menu">
          {items}
        </ul>
      </div>
    </div>
  )
}

