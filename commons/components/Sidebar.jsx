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

  const currentSearchParams = new URLSearchParams(window.location.search);
  const focusId = currentSearchParams.get("focus_id");
  const notesLink = focusId ? `/notes/?focus_id=${focusId}` : "/notes/";

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
      <Link className="sidebar-button" to={notesLink}>
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
      <div className="sidebar-button" activeClassName="is-active" to="/archives" shouldPreserveSearchParams>
        <ArchiveIcon />
        Archives
      </div>
      <div className="sidebar-button" activeClassName="is-active" to="/trash" shouldPreserveSearchParams>
        <TrashIcon />
        Trash
      </div>
      

      <div className="sidebar-section">
        <SidebarTagsList tags={tags} />
      </div>
    </div>
  );
}
