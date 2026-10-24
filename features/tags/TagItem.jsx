import { h } from "../../assets/preact.esm.js"
import { CloseIcon } from "../../commons/components/Icon.jsx";
import Link from "../../commons/components/Link.jsx";

export const TAG_COLORS = ["gray", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"];

const DEFAULT_TAG_COLOR = "gray";

export default function TagItem({ tag, variant = "pill", className = "", isEditable, onRemoveTag }) {
  if (variant === "label") {
    return <span className={getTagClassName(className, tag)}>{tag.name}</span>;
  }

  if (isEditable) {
    return (
      <div className={getTagClassName("tag is-editable", tag)}>
        <span className="tag-label">{tag.name}</span>
        <span className="tag-remove" onClick={onRemoveTag}>
          <CloseIcon />
        </span>
      </div>
    );
  }

  return (
    <Link className={getTagClassName("tag", tag)} to={`/notes/?tagId=${tag.tagId}`} shouldPreserveSearchParams>
      {tag.name}
    </Link>
  );
}

function getTagClassName(baseClassName, tag) {
  if (tag.color === DEFAULT_TAG_COLOR || !TAG_COLORS.includes(tag.color)) {
    return baseClassName;
  }

  return `${baseClassName} color-${tag.color}`;
}
