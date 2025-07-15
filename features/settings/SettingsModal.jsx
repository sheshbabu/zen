import { h, render, useState } from "../../assets/preact.esm.js"
import { CloseIcon, UploadIcon, ThemeIcon, BrainCircuitIcon } from "../../commons/components/Icon.jsx";
import ImportPane from "./ImportPane.jsx";
import AppearancePane from "./AppearancePane.jsx";
import McpPane from "./McpPane.jsx";
import "./SettingsModal.css";

const tabs = [
  { id: "appearance", label: "Appearance", icon: <ThemeIcon className="settings-tab-icon" />, content: <AppearancePane /> },
  { id: "import", label: "Import", icon: <UploadIcon className="settings-tab-icon" />, content: <ImportPane /> },
  { id: "mcp", label: "MCP", icon: <BrainCircuitIcon className="settings-tab-icon" />, content: <McpPane /> }
];

export default function SettingsModal() {
  const [activeTab, setActiveTab] = useState("appearance");

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

  const sidebar = tabs.map(tab => (
    <div key={tab.id} className={`settings-tab ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => handleTabClick(tab.id)}>
      {tab.icon}
      {tab.label}
    </div>
  ));

  const paneContent = tabs.find(tab => tab.id === activeTab).content || null;

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
