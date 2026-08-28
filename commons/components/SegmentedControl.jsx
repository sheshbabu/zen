import { h } from '../../assets/preact.esm.js';
import './SegmentedControl.css';

export default function SegmentedControl({ options, value, onChange, isDisabled = false }) {
  const optionElements = options.map(option => {
    const isSelected = option.value === value;
    let className = isSelected ? 'segment selected' : 'segment';
    if (isDisabled) {
      className += ' is-disabled';
    }
    return (
      <button
        key={option.value}
        className={className}
        onClick={() => !isDisabled && onChange(option.value)}
        disabled={isDisabled}
      >
        {option.label}
      </button>
    );
  });

  let containerClassName = 'segmented-control';
  if (isDisabled) {
    containerClassName += ' is-disabled';
  }

  return (
    <div className={containerClassName}>
      {optionElements}
    </div>
  );
}
