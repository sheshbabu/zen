import { h, render, useEffect, useState, useRef } from "../../assets/preact.esm.js"
import FocusDetailsModal from './FocusDetailsModal.jsx';
import { ArrowDownIcon, PencilIcon } from "../../commons/components/Icon.jsx";
import Button from "../../commons/components/Button.jsx";
import navigateTo from "../../commons/utils/navigateTo.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";
import { useAppContext } from "../../contexts/AppContext.jsx";

export default function FocusSwitcher() {
  const { focusModes, refreshFocusModes, refreshTags } = useAppContext();

  let currentFocusModes = focusModes;
  if (currentFocusModes.length === 0) {
    currentFocusModes = [{ focusId: 0, name: "Everything" }];
  }

  const [selectedFocusMode, setSelectedFocusMode] = useState(currentFocusModes[0]);
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
    setSelectedFocusMode(currentFocusModes.find(focusMode => focusMode.focusId === parseInt(selectedFocusId, 10)) || currentFocusModes[0]);
  }, [selectedFocusId, currentFocusModes]);

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
    render(<FocusDetailsModal mode="create" refreshFocusModes={refreshFocusModes} refreshTags={refreshTags} />, document.querySelector('.modal-root'));
  }

  function handleEditClick(e, focusMode) {
    e.stopPropagation();
    setIsDropdownOpen(false);
    render(<FocusDetailsModal mode="edit" focusMode={focusMode} refreshFocusModes={refreshFocusModes} refreshTags={refreshTags} />, document.querySelector('.modal-root'));
  }

  const items = currentFocusModes.map(focusMode => {
    let editIcon = null;
    if (focusMode.focusId !== 0) {
      editIcon = <PencilIcon onClick={e => handleEditClick(e, focusMode)} />
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

