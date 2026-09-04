import { h, useState } from "../../assets/preact.esm.js";
import AutoSavePreferences from "../../commons/preferences/AutoSavePreferences.js";
import Toggle from "../../commons/components/Toggle.jsx";

export default function EditorPane() {
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => AutoSavePreferences.isEnabled());

  function handleAutoSaveChange(newValue) {
    setIsAutoSaveEnabled(newValue);
    AutoSavePreferences.setEnabled(newValue);
  }

  return (
    <div className="settings-tab-content">
      <h3>Editor</h3>
      <p>Configure how the note editor behaves while you write.</p>
      <div className="settings-toggle-option">
        <div className="settings-toggle-info">
          <div className="settings-toggle-label">Auto Save</div>
          <div className="settings-toggle-description">Automatically save notes while you type</div>
        </div>
        <Toggle isEnabled={isAutoSaveEnabled} onChange={handleAutoSaveChange} />
      </div>
    </div>
  );
}
