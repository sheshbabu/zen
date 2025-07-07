import { h, render } from "../../assets/preact.esm.js"
import Link from './Link.jsx';
import SearchMenu from "../../features/search/SearchMenu.jsx";
import { NotesIcon, SearchIcon, NewIcon } from "./Icon.jsx"

export default function MobileNavbar() {
  function handleSearchClick() {
    render(<SearchMenu />, document.querySelector('.modal-root'));
  }

  return (
    <div className="mobile-navbar-container">
      <div className="mobile-navbar">
        <Link className="mobile-navbar-button" to="/notes/" shouldPreserveSearchParams>
          <NotesIcon />
          Notes
        </Link>
        <div className="mobile-navbar-button" onClick={handleSearchClick}>
          <SearchIcon />
          Search
        </div>
        <Link className="mobile-navbar-button" to="/notes/new" shouldPreserveSearchParams>
          <NewIcon />
          New
        </Link>
      </div>
    </div>
  );
}
