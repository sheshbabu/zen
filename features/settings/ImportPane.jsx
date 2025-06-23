import { h, useState } from "../../assets/preact.esm.js"
import { UploadIcon } from "../../commons/components/Icon.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import ApiClient from "../../commons/http/ApiClient.js";

export default function ImportPane() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);

    if (!files.length) {
      showToast("No files selected. Please choose files to upload.");
      return;
    }

    const supportedFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'md' || ext === 'txt';
    });

    const unsupportedCount = files.length - supportedFiles.length;

    if (supportedFiles.length === 0) {
      showToast("No supported files found. Only .md and .txt files are supported.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: supportedFiles.length });

    try {
      let uploadedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        setUploadProgress({ current: i + 1, total: supportedFiles.length });

        try {
          const formData = new FormData();
          formData.append('file', file);
          await ApiClient.importFile(formData);
          uploadedCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });

      let message = ""
      if (uploadedCount > 0) {
        message = `${uploadedCount} files uploaded.`;
      }

      if (errorCount > 0) {
        message += ` ${errorCount} errors.`;
      }

      if (unsupportedCount > 0) {
        message += ` ${unsupportedCount} skipped.`;
      }

      if (message === "") {
        message = "No files were uploaded.";
      } else {
        message += "  Reloading in 5 seconds.";
      }

      showToast(message);
      e.target.value = '';

      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      console.error('Upload error:', error);
    }
  }

  return (
    <div className="settings-tab-content">
      <h3>Import Files</h3>
      <p>Import .md or .txt files.</p>

      <div className="beta-banner">
        <div className="beta-badge">Beta</div>
        <div className="beta-description">
          This feature is in testing. Please back up your data before use.
        </div>
      </div>

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
          {isUploading ? 'Uploading...' : 'Choose folder'}
        </label>

        <UploadProgress isUploading={isUploading} uploadProgress={uploadProgress} />
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
        Uploading {uploadProgress.current} of {uploadProgress.total} files...
      </div>
      <div className="upload-progress-bar">
        <div className="upload-progress-fill" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
      </div>
    </div>
  );
}