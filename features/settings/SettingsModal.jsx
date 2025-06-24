import { h, render, useState } from "../../assets/preact.esm.js"
import { CloseIcon, UploadIcon } from "../../commons/components/Icon.jsx";
import ImportPane from "./ImportPane.jsx";

const tabs = [{ id: "import", label: "Import" }]

export default function SettingsModal() {
  const [activeTab, setActiveTab] = useState("import");
  
  let sidebar = [];
  let paneContent = null;

  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      closeModal();
    }
  }

  function closeModal() {
    render(null, document.querySelector('.modal-root'));
  }

  function handleTabClick(tabId) {
    setActiveTab(tabId);
  }

  sidebar = tabs.map(tab => (
    <div key={tab.id} className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabClick(tab.id)}>
      <UploadIcon className="settings-tab-icon" />
      {tab.label}
    </div>
  ));

  if (activeTab === "import") {
    paneContent = <ImportPane />;
  }

  return (
    <div className="modal-backdrop-container is-centered" onClick={handleBackdropClick}>
      <div className="modal-content-container settings-modal">
        <div className="modal-header">
          <h3 className="modal-title">Settings</h3>
          <CloseIcon className="notes-editor-toolbar-button-close" onClick={closeModal} />
        </div>
        <div className="settings-content">
          <div className="settings-sidebar">
            {sidebar}
          </div>
          <div className="settings-main">
            {paneContent}
          </div>
        </div>
      </div>
    </div>
  );
}
