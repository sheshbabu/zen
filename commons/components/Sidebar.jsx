import { h } from "../../assets/preact.esm.js"
import Link from './Link.jsx';
import SidebarTagsList from "../../features/tags/SidebarTagsList.jsx";
import FocusSwitcher from "../../features/focus/FocusSwitcher.jsx";
import { NotesIcon, SearchIcon, NewIcon, BoardIcon, SettingsIcon } from "./Icon.jsx"

export default function Sidebar({ focusModes, tags }) {
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
      <Link className="sidebar-button" to="/">
        <SearchIcon />
        Search
      </Link>
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
