import { h, useState } from "../../assets/preact.esm.js";
import AutoSavePreferences from "../../commons/preferences/AutoSavePreferences.js";
import SpellcheckPreferences from "../../commons/preferences/SpellcheckPreferences.js";
import Toggle from "../../commons/components/Toggle.jsx";

export default function EditorPane() {
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => AutoSavePreferences.isEnabled());
  const [isSpellcheckEnabled, setIsSpellcheckEnabled] = useState(() => SpellcheckPreferences.isEnabled());

  function handleAutoSaveChange(newValue) {
    setIsAutoSaveEnabled(newValue);
    AutoSavePreferences.setEnabled(newValue);
  }

  function handleSpellcheckChange(newValue) {
    setIsSpellcheckEnabled(newValue);
    SpellcheckPreferences.setEnabled(newValue);
  }

  return (
    <div className="settings-tab-content">
      <h3>Editor</h3>
      <p>Configure how the note editor behaves while you write.</p>
      <ToggleOption
        label="Auto Save"
        description="Automatically save notes while you type"
        isEnabled={isAutoSaveEnabled}
        onChange={handleAutoSaveChange}
      />
      <ToggleOption
        label="Spellcheck"
        description="Highlight misspelled words while you write"
        isEnabled={isSpellcheckEnabled}
        onChange={handleSpellcheckChange}
      />
    </div>
  );
}

function ToggleOption({ label, description, isEnabled, onChange }) {
  return (
    <div className="settings-toggle-option">
      <div className="settings-toggle-info">
        <div className="settings-toggle-label">{label}</div>
        <div className="settings-toggle-description">{description}</div>
      </div>
      <Toggle isEnabled={isEnabled} onChange={onChange} />
    </div>
  );
}
