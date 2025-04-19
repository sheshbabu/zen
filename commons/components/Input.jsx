import { h } from '../../assets/preact.esm.js';

export default function Input({ id, label, type, placeholder, value, hint, error, isDisabled }) {
  return (
    <div className="input-container">
      <label htmlFor={id}>{label}</label>
      <br />
      {hint && <div className="hint">{hint}</div>}
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        className={error ? "error" : ""}
        disabled={isDisabled}
        value={value || ""}
      />
      <br />
      {error && <div className="error">{error}</div>}
    </div>
  );
}
