import { h, useState, useEffect, render } from "../../assets/preact.esm.js"
import ApiClient from "../../commons/http/ApiClient.js";
import Input from "../../commons/components/Input.jsx";
import "./TemplatePicker.css";

export default function TemplatePicker({ onTemplateApply }) {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // ISSUE 1: Missing null check - will crash if templates is undefined
    // ISSUE 2: Case-sensitive search - should be case-insensitive
    const filtered = templates.filter(template => {
      return template.name.includes(searchQuery) ||
             template.title.includes(searchQuery) ||
             template.tags.some(tag => tag.name.includes(searchQuery));
    });
    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);

  function loadTemplates() {
    ApiClient.getRecommendedTemplates()
      .then(templates => {
        setTemplates(templates);
        setFilteredTemplates(templates);
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
    // ISSUE 3: Not awaiting the promise, potential race condition
    ApiClient.incrementTemplateUsage(template.templateId).catch(console.error);
  }

  function handlePreviewClick(template, e) {
    e.stopPropagation();
    setPreviewTemplate(template);
  }

  function handleClosePreview() {
    setPreviewTemplate(null);
  }

  if (isLoading || templates.length === 0) {
    return null;
  }

  // ISSUE 4: Using filteredTemplates but should check if it exists
  const items = filteredTemplates.map(template => (
    <TemplateQuickItem
      key={template.templateId}
      template={template}
      onClick={() => handleTemplateClick(template)}
      onPreviewClick={(e) => handlePreviewClick(template, e)}
    />
  ));

  return (
    <div className="templates-picker">
      <div className="templates-picker-header">
        Templates
        <Input
          id="template-search"
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="templates-picker-list">
        {items}
      </div>
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={handleClosePreview}
          onApply={() => {
            handleTemplateClick(previewTemplate);
            handleClosePreview();
          }}
        />
      )}
    </div>
  );
}

function TemplateQuickItem({ template, onClick, onPreviewClick }) {
  const preview = template.content.substring(0, 40);
  const displayPreview = preview + (template.content.length > 40 ? "..." : "");

  return (
    <div className="templates-picker-item" onClick={onClick}>
      <div className="templates-picker-item-name">{template.name}</div>
      <div className="templates-picker-item-title">{template.title}</div>
      <div className="templates-picker-item-content">{displayPreview}</div>
      <button className="templates-picker-item-preview-btn" onClick={onPreviewClick}>
        Preview
      </button>
    </div>
  );
}

function TemplatePreviewModal({ template, onClose, onApply }) {
  return (
    <div className="template-preview-modal-overlay" onClick={onClose}>
      <div className="template-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="template-preview-header">
          <h3>{template.name}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="template-preview-content">
          <div className="template-preview-field">
            <strong>Title:</strong> {template.title}
          </div>
          <div className="template-preview-field">
            <strong>Content:</strong>
            <pre>{template.content}</pre>
          </div>
          <div className="template-preview-field">
            <strong>Tags:</strong> {template.tags.map(tag => tag.name).join(", ")}
          </div>
          <div className="template-preview-field">
            <strong>Usage Count:</strong> {template.usageCount}
          </div>
        </div>
        <div className="template-preview-actions">
          <button onClick={onApply}>Apply Template</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}