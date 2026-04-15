import { h } from '../../assets/preact.esm.js';
import './EmptyState.css';

export default function EmptyState({ icon, title, description, actionButton }) {
  let iconElement = null;
  if (icon) {
    iconElement = <div className="empty-state-icon">{icon}</div>;
  }

  let titleElement = null;
  if (title) {
    titleElement = <h2 className="empty-state-title">{title}</h2>;
  }

  let descriptionElement = null;
  if (description) {
    descriptionElement = <p className="empty-state-description">{description}</p>;
  }

  let actionElement = null;
  if (actionButton) {
    actionElement = <div className="empty-state-action">{actionButton}</div>;
  }

  return (
    <div className="empty-state">
      {iconElement}
      {titleElement}
      {descriptionElement}
      {actionElement}
    </div>
  );
}
