import { useState, useRef } from "../../assets/preact.esm.js";
import ApiClient from "../../commons/http/ApiClient.js";

function useImageUpload({ insertAtCursor }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    ApiClient.uploadImage(formData)
      .then(result => {
        const imageUrl = `![](/images/${result.filename})`;
        insertAtCursor(imageUrl);
      });
  }

  function processImageFiles(files) {
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        setAttachments((prevAttachments) => [...prevAttachments, file]);
        uploadImage(file);
      }
    }
  }

  function handlePaste(e) {
    const items = e.clipboardData.items;

    // Ignore if it doesn't contain any images
    if (Array.from(items).every(item => item.type.indexOf('image') === -1)) {
      return;
    }

    e.preventDefault();
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        setAttachments((prevAttachments) => [...prevAttachments, file]);
        uploadImage(file);
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDraggingOver(false);
  }

  function handleImageDrop(e) {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    processImageFiles(files);
  }

  function handleDropzoneClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e) {
    const files = e.target.files;
    if (files) {
      processImageFiles(files);
      e.target.value = '';
    }
  }

  function resetAttachments() {
    setAttachments([]);
  }

  return {
    isDraggingOver,
    attachments,
    fileInputRef,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleImageDrop,
    handleDropzoneClick,
    handleFileInputChange,
    resetAttachments
  };
}

export default useImageUpload;