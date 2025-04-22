import { h, render } from "../../assets/preact.esm.js"
import Link from './Link.jsx';
import SidebarTagsList from "../../features/tags/SidebarTagsList.jsx";
import FocusSwitcher from "../../features/focus/FocusSwitcher.jsx";
import SearchMenu from "../../features/search/SearchMenu.jsx";
import { NotesIcon, SearchIcon, NewIcon, ArchiveIcon, TrashIcon, BoardIcon, SettingsIcon } from "./Icon.jsx"

export default function Sidebar({ focusModes, tags }) {
  function handleSearchClick() {
    render(<SearchMenu />, document.querySelector('.modal-root'));
  }

  return (
    <div>
      <FocusSwitcher focusModes={focusModes} />

      <Link className="sidebar-button" to="/notes/new" shouldPreserveSearchParams>
        <NewIcon />
        New
      </Link>
      <div className="sidebar-button" onClick={handleSearchClick}>
        <SearchIcon />
        Search
      </div>
      <Link className="sidebar-button" to="/notes/">
        <NotesIcon />
        Notes
      </Link>
      {/* <Link className="sidebar-button" to="/">
        <BoardIcon />
        Boards
      </Link>
      <Link className="sidebar-button" to="/">
        <SettingsIcon />
        Settings
      </Link> */}
      <div className="sidebar-button" to="/archives" shouldPreserveSearchParams>
        <ArchiveIcon />
        Archives
      </div>
      <div className="sidebar-button" to="/trash" shouldPreserveSearchParams>
        <TrashIcon />
        Trash
      </div>
      

      <div className="sidebar-section">
        <SidebarTagsList tags={tags} />
      </div>
    </div>
  );
}
