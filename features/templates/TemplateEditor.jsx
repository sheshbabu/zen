import { h, render, useState, useCallback } from "../../assets/preact.esm.js"
import ApiClient from '../../commons/http/ApiClient.js';
import NotesEditorTags from "../tags/NotesEditorTags.jsx";
import Button from '../../commons/components/Button.jsx';
import Input from '../../commons/components/Input.jsx';
import DropdownMenu from '../../commons/components/DropdownMenu.jsx';
import { showToast } from '../../commons/components/Toast.jsx';
import navigateTo from '../../commons/utils/navigateTo.js';
import TemplateDeleteModal from './TemplateDeleteModal.jsx';
import "./TemplateEditor.css";

// https://go.dev/src/time/format.go
const HELP = `
Examples
  {{date}}                      - Current (YYYY-MM-DD)
  {{date:01/02/2006}}           - Current date with custom format (DD/MM/YYYY)
  {{time}}                      - Current time (HH:MM)
  {{time:15:04:05}}             - Current time with custom format (HH:MM:SS)
  {{datetime}}                  - Current date and time
  {{datetime:01/02/2006 15:04}} - Current date and time with custom format DD/MM/YYYY HH:MM)

Formatting
  Year:             "2006" "06"
  Month:            "Jan" "January" "01" "1"
  Day of the week:  "Mon" "Monday"
  Day of the month: "2" "_2" "02"
  Day of the year:  "__2" "002"
  Hour:             "15" "3" "03" (PM or AM)
  Minute:           "4" "04"
  Second:           "5" "05"
  AM/PM mark:       "PM"
`.trim()

export default function TemplateEditor({ selectedTemplate, isNewTemplate, onChange, onClose }) {
  if (selectedTemplate === null && isNewTemplate === false) {
    return null;
  }

  const [name, setName] = useState(selectedTemplate?.name || "");
  const [title, setTitle] = useState(selectedTemplate?.title || "");
  const [content, setContent] = useState(selectedTemplate?.content || "");
  const [tags, setTags] = useState(selectedTemplate?.tags || []);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const handleSaveClick = useCallback(() => {
    setNameError("");

    const template = {
      name: name.trim(),
      title: title.trim(),
      content: content,
      tags: tags,
    };

    let promise = null;
    setIsSaveLoading(true);

    if (isNewTemplate === true) {
      promise = ApiClient.createTemplate(template);
    } else if (selectedTemplate && selectedTemplate.templateId) {
      promise = ApiClient.updateTemplate(selectedTemplate.templateId, template);
    } else {
      setIsSaveLoading(false);
      showToast("Error: Template not found");
      return;
    }

    promise
      .then(template => {
        if (isNewTemplate) {
          navigateTo(`/templates/${template.templateId}`);
          showToast("Template created");
        } else {
          navigateTo("/templates/");
          showToast("Template updated");
        }

        onChange();
        onClose();
      })
      .catch(error => {
        console.error('Error saving template:', error);
        if (error.code === "TEMPLATE_NAME_REQUIRED") {
          setNameError("Template name is required");
        }
      })
      .finally(() => {
        setIsSaveLoading(false);
      });
  }, [name, title, content, tags, isNewTemplate, selectedTemplate, onChange, onClose]);

  function handleContentChange(e) {
    setContent(e.target.value);
  }

  function handleAddTag(tag) {
    setTags((prevTags) => [...prevTags, tag]);
  }

  function handleRemoveTag(tag) {
    setTags((prevTags) => prevTags.filter(t => t.tagId !== tag.tagId));
  }

  function handleDeleteClick() {
    render(
      <TemplateDeleteModal onDeleteClick={handleDeleteConfirmClick} onCloseClick={handleDeleteCloseClick} />,
      document.querySelector('.modal-root'));
  }

  function handleDeleteConfirmClick() {
    ApiClient.deleteTemplate(selectedTemplate.templateId)
      .then(() => {
        handleDeleteCloseClick();
        showToast("Template deleted");
        navigateTo("/templates/");
        onChange();
        onClose();
      });
  }

  function handleDeleteCloseClick() {
    render(null, document.querySelector('.modal-root'));
  }

  function handleDuplicateClick() {
    ApiClient.duplicateTemplate(selectedTemplate.templateId)
      .then((duplicatedTemplate) => {
        showToast("Template duplicated");
        navigateTo(`/templates/${duplicatedTemplate.templateId}`);
        onChange();
      })
      .catch(error => {
        console.error('Error duplicating template:', error);
        showToast("Failed to duplicate template");
      });
  }

  function getMenuActions() {
    if (isNewTemplate) {
      return [];
    }

    return [
      <div style="width: 100px;" onClick={handleDuplicateClick}>Duplicate</div>,
      <div style="width: 80px;" onClick={handleDeleteClick}>Delete</div>
    ];
  }

  return (
    <div className="templates-editor">
      <div className="templates-editor-header">
        <div className="templates-editor-header-left">
          <h2 className="templates-editor-title">
            {isNewTemplate ? "New Template" : "Edit Template"}
          </h2>
        </div>

        <div className="templates-editor-header-right">
          <Button variant="ghost" onClick={handleSaveClick}>{isSaveLoading ? "Saving..." : "Save"}</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!isNewTemplate && <DropdownMenu actions={getMenuActions()} />}
        </div>
      </div>

      <div className="templates-editor-content">
        <Input id="template-name" label="Name" type="text" placeholder="Enter template name" value={name} hint="" error={nameError} isDisabled={false} onChange={e => setName(e.target.value)} />

        <Input id="template-title" label="Title" type="text" placeholder="Enter note title" value={title} hint="" error="" isDisabled={false} onChange={e => setTitle(e.target.value)} />

        <div className="form-field-container">
          <label>Tags</label>
          <br />
          <NotesEditorTags tags={tags} isEditable canCreateTag={false} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
        </div>

        <div className="input-container form-field-container">
          <label htmlFor="template-content">Content</label>
          <br />
          <textarea id="template-content" className="templates-editor-textarea" value={content} onChange={handleContentChange} placeholder="Enter note content" required />
          <br />
        </div>

        <div className="templates-editor-help">
          <h4>Placeholder Help</h4>
          <pre>
            {HELP}
          </pre>
        </div>
      </div>
    </div >
  );
}