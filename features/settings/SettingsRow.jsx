import { h } from "../../assets/preact.esm.js";

export default function SettingsRow({ icon, label, description, children }) {
  let descriptionElement = null;
  if (description !== undefined) {
    descriptionElement = <div className="settings-row-description">{description}</div>;
  }

  return (
    <div className="settings-row">
      {icon}
      <div className="settings-row-info">
        <div className="settings-row-label">{label}</div>
        {descriptionElement}
      </div>
      {children}
    </div>
  );
}
