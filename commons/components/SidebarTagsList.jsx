import { h } from '../../dependencies/preact.esm.js';
import Link from "./Link.jsx"

function SidebarTagsList({ tags = [] }) {
  return (
    <div>
      <div className="sidebar-section-title">Tags</div>
      {tags.map(tag => (
        <Link key={tag.tag_id} to={`/?tag_id=${tag.tag_id}`}>{tag.name}</Link>
      ))}
    </div>
  );
}

export default SidebarTagsList;
