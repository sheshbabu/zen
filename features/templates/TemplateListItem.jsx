import { h } from "../../assets/preact.esm.js"
import Link from '../../commons/components/Link.jsx';
import formatDate from '../../commons/utils/formatDate.js';
import "./TemplateListItem.css";

export default function TemplateListItem({ template }) {
  let title = null;
  if (template.title && template.title.length > 0) {
    title = <div className="templates-list-item-description">{template.title}</div>;
  }

  let tags = []
  if (template.tags && template.tags.length > 0) {
    tags = template.tags.map(tag => (
      <div className="templates-list-item-tag" key={tag.tagId} >
        {tag.name}
      </div >
    ))
  }

  const updatedAtDate = new Date(template.updatedAt);
  const shortUpdatedAt = formatDate(updatedAtDate);
  const fullUpdatedAt = updatedAtDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Link to={`/templates/${template.templateId}`} className="templates-list-item">
      <div className="templates-list-item-main">
        <div className="templates-list-item-header">
          <h3 className="templates-list-item-title">{template.name}</h3>
        </div>

        <div className="templates-list-item-footer">
          <div className="templates-list-item-tags">{tags}</div>
          <span className="templates-list-item-subtext" title={fullUpdatedAt}>{shortUpdatedAt}</span>
        </div>
      </div>
    </Link>
  );
}