import { h, useState } from "../../assets/preact.esm.js"
import { DownloadIcon } from "../../commons/components/Icon.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import Button from "../../commons/components/Button.jsx";
import SettingsRow from "./SettingsRow.jsx";
import SettingsSection from "./SettingsSection.jsx";

export default function ExportPane() {
  const [isExporting, setIsExporting] = useState(false);

  function handleExportClick() {
    setIsExporting(true);

    ApiClient.exportNotes()
      .then(() => {
        showToast("Notes exported successfully!");
      })
      .catch(() => {
        showToast("Failed to export notes. Please try again.");
      })
      .finally(() => {
        setIsExporting(false);
      });
  }

  return (
    <div className="settings-tab-content">
      <SettingsSection title="Export Notes" description="Download all your notes as a zip file.">
        <div className="settings-card">
          <SettingsRow icon={<DownloadIcon />} label="Export all notes" description="Markdown files and metadata in a single zip.">
            <Button variant="primary" onClick={handleExportClick} isDisabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsSection title="What's Included" description="Everything you need to move your notes elsewhere.">
        <ul className="export-info-list">
          <li><strong>Markdown files:</strong> All notes as .md files with yaml frontmatter for tags</li>
          <li><strong>Raw data:</strong> Complete json exports (notes.json, tags.json, metadata.json)</li>
          <li><strong>Cross platform:</strong> Sanitized filenames compatible with windows/mac/linux</li>
        </ul>
        <pre className="code-block">
{`zen-export-2025-08-08.zip
├── my-note.md
├── project-ideas.md
├── archived/
│   └── old-draft.md
├── images/
│   └── diagram.jpg
├── notes.json
├── tags.json
└── metadata.json`}
        </pre>
      </SettingsSection>
    </div>
  )
}