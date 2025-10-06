import { h } from "../../assets/preact.esm.js"
import Link from "../../commons/components/Link.jsx"
import { PencilIcon } from "../../commons/components/Icon.jsx";
import TagDetailModal from "./TagDetailModal.jsx";
import { openModal } from "../../commons/components/Modal.jsx";
import { useAppContext } from "../../commons/contexts/AppContext.jsx";

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
    openModal(<TagDetailModal tag={tag} refreshTags={refreshTags} />);
  }

  return (
    <div>
      <div className="sidebar-section-title">Tags</div>
      {items}
    </div>
  );
}