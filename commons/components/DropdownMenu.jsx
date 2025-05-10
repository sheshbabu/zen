import { h, useState, useEffect, useRef } from "../../assets/preact.esm.js"
import { EllipsisIcon } from "../../commons/components/Icon.jsx";

export default function DropdownMenu({ actions }) {
  if (actions.length === 0) {
    return null;
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

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

  function handleDropdownClick() {
    setIsDropdownOpen(prevIsDropdownOpen => !prevIsDropdownOpen);
  }

  function handleItemClick(action) {
    setIsDropdownOpen(false);
  }

  const items = actions.map(action => (
    <li key={action} className="dropdown-option" onClick={() => handleItemClick(action)}>
      {action}
    </li>
  ));


  return (
    <div ref={dropdownRef}>
      <div className="ghost-button" onClick={handleDropdownClick}><EllipsisIcon /></div>
      <div className={`dropdown-container ${isDropdownOpen ? 'open' : ''}`}>
        <ul className="dropdown-menu">
          {items}
        </ul>
      </div>
    </div>
  );
}