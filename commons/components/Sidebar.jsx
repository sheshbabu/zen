import { h, render, Fragment } from "../../assets/preact.esm.js"
import Link from './Link.jsx';
import SidebarTagsList from "../../features/tags/SidebarTagsList.jsx";
import FocusSwitcher from "../../features/focus/FocusSwitcher.jsx";
import SearchMenu from "../../features/search/SearchMenu.jsx";
import SettingsModal from "../../features/settings/SettingsModal.jsx";
import { NotesIcon, SearchIcon, NewIcon, ArchiveIcon, TrashIcon, BoardIcon, SettingsIcon, TemplatesIcon } from "./Icon.jsx"

export default function Sidebar({ focusModes, tags }) {
  function handleSearchClick() {
    render(<SearchMenu />, document.querySelector('.modal-root'));
  }

  function handleSettingsClick() {
    render(<SettingsModal />, document.querySelector('.modal-root'));
  }

  const currentSearchParams = new URLSearchParams(window.location.search);
  const focusId = currentSearchParams.get("focusId");
  const notesLink = focusId ? `/notes/?focusId=${focusId}` : "/notes/";

  return (
    <Fragment>
      <div className="sidebar-fixed">
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
        <div className="sidebar-button" activeClassName="is-active" to="/archives" shouldPreserveSearchParams>
          <TemplatesIcon />
          Templates
        </div>*/}
        <Link className="sidebar-button" activeClassName="is-active" to="/notes/?isArchived=true">
          <ArchiveIcon />
          Archives
        </Link>
        <Link className="sidebar-button" activeClassName="is-active" to="/notes/?isDeleted=true">
          <TrashIcon />
          Trash
        </Link>
        <div className="sidebar-button" onClick={handleSettingsClick}>
          <SettingsIcon />
          Settings
        </div>
      </div>

      <div className="sidebar-scrollable">
        <div className="sidebar-section">
          <SidebarTagsList tags={tags} />
        </div>
      </div>
    </Fragment>
  );
}
