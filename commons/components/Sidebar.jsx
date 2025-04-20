import { h, render } from "../../assets/preact.esm.js"
import Link from './Link.jsx';
import SidebarTagsList from "../../features/tags/SidebarTagsList.jsx";
import FocusSwitcher from "../../features/focus/FocusSwitcher.jsx";
import SearchMenu from "../../features/search/SearchMenu.jsx";
import { NotesIcon, SearchIcon, NewIcon, BoardIcon, SettingsIcon } from "./Icon.jsx"

export default function Sidebar({ focusModes, tags }) {
  function handleSearchClick() {
    render(<SearchMenu />, document.querySelector('.modal-root'));
  }

  return (
    <div>
      <FocusSwitcher focusModes={focusModes}/>

      <Link className="sidebar-button" to="/notes/new" shouldPreserveSearchParams>
        <NewIcon />
        New
      </Link>
      <Link className="sidebar-button" to="/notes/">
        <NotesIcon />
        Notes
      </Link>
      <Link className="sidebar-button" to="/">
        <BoardIcon />
        Boards
      </Link>
      <div className="sidebar-button" onClick={handleSearchClick}>
        <SearchIcon />
        Search
      </div>
      <Link className="sidebar-button" to="/">
        <SettingsIcon />
        Settings
      </Link>

      <div className="sidebar-section">
        <SidebarTagsList tags={tags} />
      </div>
    </div>
  );
}
