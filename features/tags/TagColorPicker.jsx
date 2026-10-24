import { h } from "../../assets/preact.esm.js"
import { CheckIcon } from "../../commons/components/Icon.jsx";
import { TAG_COLORS } from "./TagItem.jsx";
import "./TagColorPicker.css";

export default function TagColorPicker({ selectedColor, onColorChange }) {
  const swatches = TAG_COLORS.map(color => {
    const isSelected = color === selectedColor;
    const className = isSelected ? `tag-color-swatch color-${color} is-selected` : `tag-color-swatch color-${color}`;
    let checkIcon = null;

    if (isSelected) {
      checkIcon = <CheckIcon />;
    }

    return (
      <button
        key={color}
        type="button"
        className={className}
        onClick={() => onColorChange(color)}
      >
        {checkIcon}
      </button>
    );
  });

  return (
    <div className="tag-color-picker">
      <label className="tag-color-picker-label">Color</label>
      <div className="tag-color-swatches">
        {swatches}
      </div>
    </div>
  );
}
