import { h, Fragment } from "../../assets/preact.esm.js"
import TemplatesListToolbar from './TemplatesListToolbar.jsx';
import TemplateListItem from './TemplateListItem.jsx';
import Spinner from '../../commons/components/Spinner.jsx';
import "./TemplatesList.css";

export default function TemplatesList({ templates = [], isLoading, onNewTemplateClick, onToggleStats }) {
  let content = <div className="templates-list-spinner"><Spinner /></div>;

  if (!isLoading) {
    const templateItems = templates.map(template => (<TemplateListItem template={template} key={template.templateId} />));

    content = (
      <div className="templates-list">
        {templateItems}
        <EmptyList templates={templates} />
      </div>
    );
  }

  return (
    <>
      <TemplatesListToolbar
        onNewTemplateClick={onNewTemplateClick}
        onToggleStats={onToggleStats}
      />
      {content}
    </>
  );
}

function EmptyList({ templates }) {
  if (templates.length > 0) {
    return null;
  }

  return (
    <div className="templates-list-empty-text">No templates found</div>
  );
}