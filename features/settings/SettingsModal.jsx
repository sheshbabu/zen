import { h, useState } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, closeModal } from "../../commons/components/Modal.jsx";
import { UploadIcon, DownloadIcon, ThemeIcon, BrainCircuitIcon, SecurityIcon } from "../../commons/components/Icon.jsx";
import ImportPane from "./ImportPane.jsx";
import ExportPane from "./ExportPane.jsx";
import AppearancePane from "./AppearancePane.jsx";
import McpPane from "./McpPane.jsx";
import SecurityPane from "./SecurityPane.jsx";
import "./SettingsModal.css";

const tabs = [
  { id: "appearance", label: "Appearance", icon: <ThemeIcon className="settings-tab-icon" />, content: <AppearancePane /> },
  { id: "account", label: "Security", icon: <SecurityIcon className="settings-tab-icon" />, content: <SecurityPane /> },
  { id: "import", label: "Import", icon: <UploadIcon className="settings-tab-icon" />, content: <ImportPane /> },
  { id: "export", label: "Export", icon: <DownloadIcon className="settings-tab-icon" />, content: <ExportPane /> },
  { id: "mcp", label: "MCP", icon: <BrainCircuitIcon className="settings-tab-icon" />, content: <McpPane /> }
];

export default function SettingsModal() {
  const [activeTab, setActiveTab] = useState("appearance");

  function handleCloseModal() {
    closeModal();
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
    <ModalBackdrop onClose={handleCloseModal}>
      <ModalContainer className="settings-modal">
        <ModalHeader title="Settings" onClose={handleCloseModal} />
        <div className="settings-content">
          <div className="settings-sidebar">
            {sidebar}
          </div>
          <div className="settings-main">
            {paneContent}
          </div>
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}
