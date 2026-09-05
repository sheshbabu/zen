import { h } from '../../assets/preact.esm.js';
import './Toggle.css';

export default function Toggle({ isEnabled = false, isDisabled = false, onChange, className = '' }) {
  const toggleClasses = ["toggle", isEnabled ? "is-enabled" : "", className].join(" ");

  function handleClick() {
    if (isDisabled === true) {
      return;
    }

    onChange(!isEnabled);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEnabled}
      className={toggleClasses}
      disabled={isDisabled}
      onClick={handleClick}>
      <span className="toggle-knob" />
    </button>
  );
}
