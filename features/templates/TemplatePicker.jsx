import { h, useState, useEffect } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import "./TemplatePicker.css";

export default function TemplatePicker({ onTemplateApply }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  function loadTemplates() {
    ApiClient.getRecommendedTemplates()
      .then(templates => {
        setTemplates(templates);
      })
      .catch(error => {
        console.error('Error loading recommended templates:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleTemplateClick(template) {
    onTemplateApply(template.title, template.content, template.tags);
    ApiClient.incrementTemplateUsage(template.templateId).catch(console.error);
  }

  if (isLoading || templates.length === 0) {
    return null;
  }

  const items = templates.map(template => (
    <TemplateQuickItem key={template.templateId} template={template} onClick={() => handleTemplateClick(template)} />
  ));

  return (
    <div className="templates-picker">
      <div className="templates-picker-header">
        Templates
      </div>
      <div className="templates-picker-list">
        {items}
      </div>
    </div>
  );
}

function TemplateQuickItem({ template, onClick }) {
  const preview = template.content.substring(0, 40);
  const displayPreview = preview + (template.content.length > 40 ? "..." : "");

  return (
    <div className="templates-picker-item" onClick={onClick}>
      <div className="templates-picker-item-name">{template.name}</div>
      <div className="templates-picker-item-title">{template.title}</div>
      <div className="templates-picker-item-content">{displayPreview}</div>
    </div>
  );
}