import { h, useState } from "../../assets/preact.esm.js"
import { DownloadIcon } from "../../commons/components/Icon.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import Button from "../../commons/components/Button.jsx";

export default function ExportPane() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportClick() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      await ApiClient.exportNotes();
      showToast("Notes exported successfully!");
    } catch (error) {
      console.error('Export error:', error);
      showToast("Failed to export notes. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="settings-tab-content">
      <h3>Export Notes</h3>
      <p>Download all your notes as a zip file containing markdown files and metadata.</p>
      
      <div className="export-section">
        <h4>What's included:</h4>
        <ul className="export-info-list">
          <li><strong>Markdown files:</strong> All notes as .md files with yaml frontmatter for tags</li>
          <li><strong>Raw data:</strong> Complete json exports (notes.json, tags.json, metadata.json)</li>
          <li><strong>Cross platform:</strong> Sanitized filenames compatible with windows/mac/linux</li>
        </ul>
        
        <h4>Export structure:</h4>
        <pre className="export-tree">
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
      </div>

      <div className="export-actions">
        <Button 
          variant={`primary ${isExporting ? 'disabled' : ''}`}
          onClick={handleExportClick}
          isDisabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
    </div>
  )
}