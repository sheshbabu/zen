import { h } from "../../assets/preact.esm.js"
import Link from "../../commons/components/Link.jsx"

export default function SidebarTagsList({ tags = [] }) {
  return (
    <div>
      <div className="sidebar-section-title">Tags</div>
      {tags.map(tag => (
        <Link key={tag.tag_id} to={`/notes/?tag_id=${tag.tag_id}`}>{tag.name}</Link>
      ))}
    </div>
  );
}