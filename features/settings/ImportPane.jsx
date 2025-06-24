import { h, useState } from "../../assets/preact.esm.js"
import { UploadIcon, SuccessIcon, WarnIcon, ErrorIcon } from "../../commons/components/Icon.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import ApiClient from "../../commons/http/ApiClient.js";

export default function ImportPane() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [skippedFiles, setSkippedFiles] = useState([]);
  const [erroredFiles, setErroredFiles] = useState([]);
  const [summaryMessage, setSummaryMessage] = useState("");

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);

    if (!files.length) {
      showToast("No files selected. Please choose files to import.");
      return;
    }

    const supportedFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'md' || ext === 'txt';
    });

    const unsupportedFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext !== 'md' && ext !== 'txt';
    });

    if (supportedFiles.length === 0) {
      showToast("No supported files found. Only .md and .txt files are supported.");
      return;
    }

    setUploadedFiles([]);
    setSkippedFiles(unsupportedFiles.map(file => file.webkitRelativePath || file.name));
    setErroredFiles([]);
    setSummaryMessage("");

    setIsUploading(true);
    setUploadProgress({ current: 0, total: supportedFiles.length });

    try {
      const newUploadedFiles = [];
      const newErroredFiles = [];

      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        setUploadProgress({ current: i + 1, total: supportedFiles.length });

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', file.webkitRelativePath);
          await ApiClient.importFile(formData);
          newUploadedFiles.push(file.webkitRelativePath || file.name);
        } catch (error) {
          newErroredFiles.push(file.webkitRelativePath || file.name);
          console.error(`Error importing ${file.name}:`, error);
        }
      }

      setUploadedFiles(newUploadedFiles);
      setErroredFiles(newErroredFiles);

      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });

      const uploadedCount = newUploadedFiles.length;
      const errorCount = newErroredFiles.length;
      const unsupportedCount = unsupportedFiles.length;

      let message = ""
      if (uploadedCount > 0) {
        message = `${uploadedCount} files imported.`;
      }

      if (errorCount > 0) {
        message += ` ${errorCount} errors.`;
      }

      if (unsupportedCount > 0) {
        message += ` ${unsupportedCount} skipped.`;
      }

      if (message === "") {
        message = "No files were imported.";
      }
      setSummaryMessage(message);
      e.target.value = '';
    } catch (error) {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      console.error('Import error:', error);
    }
  }

  return (
    <div className="settings-tab-content">
      <h3>Import Files</h3>
      <p>Import .md or .txt files.</p>

      <div className="file-upload-container">
        <input
          type="file"
          id="folder-upload"
          webkitdirectory
          directory
          multiple
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label htmlFor="folder-upload" className={`file-upload-label ${isUploading ? 'disabled' : ''}`}>
          <UploadIcon />
          {isUploading ? 'Importing...' : 'Choose folder'}
        </label>

        <UploadProgress isUploading={isUploading} uploadProgress={uploadProgress} />
        <UploadSummary
          summaryMessage={summaryMessage}
          uploadedFiles={uploadedFiles}
          skippedFiles={skippedFiles}
          erroredFiles={erroredFiles}
        />
      </div>
    </div>
  )
}

function UploadProgress({ isUploading, uploadProgress }) {
  if (!isUploading || uploadProgress.total === 0) {
    return null;
  }

  return (
    <div className="upload-progress">
      <div className="upload-progress-text">
        Importing {uploadProgress.current} of {uploadProgress.total} files...
      </div>
      <div className="upload-progress-bar">
        <div className="upload-progress-fill" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
      </div>
    </div>
  );
}

function UploadSummary({ summaryMessage, uploadedFiles, skippedFiles, erroredFiles }) {
  const hasAnyFiles = uploadedFiles.length > 0 || skippedFiles.length > 0 || erroredFiles.length > 0;

  if (!hasAnyFiles) {
    return null;
  }

  let messageSection = null;
  let uploadedSection = null;
  let skippedSection = null;
  let erroredSection = null;

  if (summaryMessage) {
    messageSection = (
      <div className="upload-summary-message">
        <p>{summaryMessage} <a href="#" onClick={() => window.location.reload()}>Refresh to see changes.</a></p>
      </div>
    );
  }

  if (uploadedFiles.length > 0) {
    const uploadedFileItems = uploadedFiles.map((fileName, index) => (
      <li key={index} className="file-item uploaded">{fileName}</li>
    ));

    uploadedSection = (
      <div className="upload-summary-section uploaded">
        <h5><SuccessIcon /> Imported ({uploadedFiles.length})</h5>
        <ul className="file-list">
          {uploadedFileItems}
        </ul>
      </div>
    );
  }

  if (skippedFiles.length > 0) {
    const skippedFileItems = skippedFiles.map((fileName, index) => (
      <li key={index} className="file-item skipped">{fileName}</li>
    ));

    skippedSection = (
      <div className="upload-summary-section skipped">
        <h5><WarnIcon /> Skipped ({skippedFiles.length})</h5>
        <ul className="file-list">
          {skippedFileItems}
        </ul>
      </div>
    );
  }

  if (erroredFiles.length > 0) {
    const erroredFileItems = erroredFiles.map((fileName, index) => (
      <li key={index} className="file-item errored">{fileName}</li>
    ));

    erroredSection = (
      <div className="upload-summary-section errored">
        <h5><ErrorIcon /> Errors ({erroredFiles.length})</h5>
        <ul className="file-list">
          {erroredFileItems}
        </ul>
      </div>
    );
  }

  return (
    <div className="upload-summary">
      <h4>Import Summary</h4>
      {messageSection}
      {uploadedSection}
      {skippedSection}
      {erroredSection}
    </div>
  );
}