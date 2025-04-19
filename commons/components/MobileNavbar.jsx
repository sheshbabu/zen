import { h } from '../../assets/preact.esm.js';
import Link from './Link.jsx';
import { NotesIcon, SearchIcon, NewIcon } from "./Icon.jsx"

export default function MobileNavbar() {
  return (
    <div className="mobile-navbar-container">
      <div className="mobile-navbar">
        <Link className="mobile-navbar-button" to="/notes/">
          <NotesIcon />
          Notes
        </Link>
        <Link className="mobile-navbar-button" to="/notes/">
          <SearchIcon />
          Search
        </Link>
        <Link className="mobile-navbar-button" to="/notes/new" shouldPreserveSearchParams>
          <NewIcon />
          New
        </Link>
      </div>
    </div>
  );
}
