import { h, useState } from "../../assets/preact.esm.js";
import AutoSavePreferences from "../../commons/preferences/AutoSavePreferences.js";
import SpellcheckPreferences from "../../commons/preferences/SpellcheckPreferences.js";
import Toggle from "../../commons/components/Toggle.jsx";
import SettingsRow from "./SettingsRow.jsx";
import SettingsSection from "./SettingsSection.jsx";
import { FileCheckIcon, SpellCheckIcon } from "../../commons/components/Icon.jsx";

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
      <SettingsSection title="Writing" description="Configure how the note editor behaves while you write.">
        <div className="settings-card">
          <SettingsRow icon={<FileCheckIcon />} label="Auto Save" description="Automatically save notes while you type">
            <Toggle isEnabled={isAutoSaveEnabled} onChange={handleAutoSaveChange} />
          </SettingsRow>
          <SettingsRow icon={<SpellCheckIcon />} label="Spellcheck" description="Highlight misspelled words while you write">
            <Toggle isEnabled={isSpellcheckEnabled} onChange={handleSpellcheckChange} />
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
}
