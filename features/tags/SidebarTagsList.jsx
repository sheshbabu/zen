import { h } from "../../assets/preact.esm.js"
import Link from "../../commons/components/Link.jsx"

export default function SidebarTagsList({ tags = [] }) {
  if (tags.length === 0) {
    return null;
  }

  const items = tags.map(tag => (
    <Link
      key={tag.tag_id}
      to={`/notes/?tag_id=${tag.tag_id}`}
      shouldPreserveSearchParams
      className="sidebar-tag-link"
      activeClassName="is-active"
    >
      {tag.name}
    </Link>
  ));

  return (
    <div>
      <div className="sidebar-section-title">Tags</div>
      {items}
    </div>
  );
}