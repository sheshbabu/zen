import { h } from "../../assets/preact.esm.js";

export default function SettingsSection({ title, description, children }) {
  let descriptionElement = null;
  if (description !== undefined) {
    descriptionElement = <p className="settings-section-description">{description}</p>;
  }

  return (
    <section className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      {descriptionElement}
      {children}
    </section>
  );
}
