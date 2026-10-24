import { h } from '../../assets/preact.esm.js';
import './Input.css';

export default function Input({ id, label, type, placeholder, value, hint, error, isDisabled, onChange }) {
  let hintElement = null;
  if (hint) {
    hintElement = <div className="hint">{hint}</div>;
  }

  let errorElement = null;
  if (error) {
    errorElement = <div className="error">{error}</div>;
  }

  return (
    <div className="input-container form-field-container">
      <label htmlFor={id}>{label}</label>
      <br />
      {hintElement}
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        className={error ? "has-error" : ""}
        disabled={isDisabled}
        value={value || ""}
        onChange={onChange}
      />
      <br />
      {errorElement}
    </div>
  );
}
