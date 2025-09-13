import { h, render } from "../../assets/preact.esm.js"
import Link from "../../commons/components/Link.jsx"
import { PencilIcon } from "../../commons/components/Icon.jsx";
import TagDetailModal from "./TagDetailModal.jsx";
import { useAppContext } from "../../contexts/AppContext.jsx";

export default function SidebarTagsList() {
  const { tags, refreshTags } = useAppContext();

  if (tags.length === 0) {
    return null;
  }

  const items = tags.map(tag => (
    <Link
      key={tag.tagId}
      to={`/notes/?tagId=${tag.tagId}`}
      shouldPreserveSearchParams
      className="sidebar-tag-link"
      activeClassName="is-active"
    >
      {tag.name}
      <PencilIcon onClick={e => handleEditClick(e, tag)} />
    </Link>
  ));

  function handleEditClick(e, tag) {
    e.stopPropagation();
    e.preventDefault();
    render(<TagDetailModal tag={tag} refreshTags={refreshTags} />, document.querySelector('.modal-root'));
  }

  return (
    <div>
      <div className="sidebar-section-title">Tags</div>
      {items}
    </div>
  );
}