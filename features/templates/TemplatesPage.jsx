import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import TemplatesList from './TemplatesList.jsx';
import TemplateEditor from './TemplateEditor.jsx';
import TemplateStats from './TemplateStats.jsx';
import TemplateImportExport from './TemplateImportExport.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";

export default function TemplatesPage({ templateId }) {
  const [templates, setTemplates] = useState([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [focusModes, setFocusModes] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    refreshTemplates();
    refreshTags();
    refreshFocusModes();
  }, []);

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

  function refreshTags() {
    ApiClient.getTags()
      .then(newTags => {
        setTags(newTags);
      })
      .catch(error => {
        console.error('Error loading tags:', error);
      });
  }

  function refreshFocusModes() {
    ApiClient.getFocusModes()
      .then(focusModes => {
        setFocusModes(focusModes);
      })
      .catch(error => {
        console.error('Error loading focus modes:', error);
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

  function handleToggleStats() {
    setShowStats(!showStats);
  }

  return (
    <div className="page-container">
      <Sidebar isOpen={true} onSidebarClose={() => { }} focusModes={focusModes} tags={tags} />

      <div className="templates-list-container">
        <TemplatesList
          templates={templates}
          isLoading={isTemplatesLoading}
          onNewTemplateClick={handleNewTemplateClick}
          onChange={handleTemplateChange}
          onToggleStats={handleToggleStats}
        />

        {showStats && (
          <div className="templates-stats-container">
            <TemplateStats templates={templates} />
            <TemplateImportExport
              templates={templates}
              onImportComplete={handleTemplateChange}
            />
          </div>
        )}
      </div>

      <div className="templates-editor-container">
        <TemplateEditor
          selectedTemplate={selectedTemplate}
          isNewTemplate={templateId === "new"}
          key={selectedTemplate?.templateId || "new"}
          onChange={handleTemplateChange}
          onClose={handleCloseEditor}
        />
      </div>

      <div className="modal-root"></div>
      <div className="toast-root"></div>
    </div>
  );
}