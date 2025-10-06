import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import TemplatesList from './TemplatesList.jsx';
import TemplateEditor from './TemplateEditor.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import { useAppContext } from "../../commons/contexts/AppContext.jsx";

export default function TemplatesPage({ templateId }) {
  const [templates, setTemplates] = useState([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { refreshTags, refreshFocusModes } = useAppContext();

  useEffect(() => {
    refreshTemplates();
    refreshTags();
    refreshFocusModes();
  }, [refreshTags, refreshFocusModes]);

  useEffect(() => {
    if (templateId === "new") {
      setSelectedTemplate(null);
      return;
    }

    if (templateId === undefined) {
      setSelectedTemplate(null);
      return;
    }

    if (templateId !== undefined) {
      const selectedTemplateId = parseInt(templateId, 10);
      ApiClient.getTemplateById(selectedTemplateId)
        .then(template => {
          setSelectedTemplate(template);
        })
        .catch(error => {
          console.error('Error loading template:', error);
        });
    }
  }, [templateId]);

  function refreshTemplates() {
    setIsTemplatesLoading(true);

    ApiClient.getTemplates()
      .then(templates => {
        setTemplates(templates);
      })
      .catch(error => {
        console.error('Error loading templates:', error);
      }).finally(() => {
        setIsTemplatesLoading(false);
      });
  }


  function handleTemplateChange() {
    refreshTemplates();
    refreshTags();
  }

  function handleNewTemplateClick() {
    navigateTo('/templates/new');
  }

  function handleCloseEditor() {
    navigateTo('/templates/');
  }

  return (
    <div className="page-container">
      <Sidebar isOpen={true} onSidebarClose={() => { }} />

      <div className="templates-list-container">
        <TemplatesList templates={templates} isLoading={isTemplatesLoading} onNewTemplateClick={handleNewTemplateClick} />
      </div>

      <div className="templates-editor-container">
        <TemplateEditor selectedTemplate={selectedTemplate} isNewTemplate={templateId === "new"} key={selectedTemplate?.templateId || "new"} onChange={handleTemplateChange} onClose={handleCloseEditor} />
      </div>

      <div className="modal-root"></div>
      <div className="toast-root"></div>
    </div>
  );
}