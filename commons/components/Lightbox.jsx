import { h, useEffect, useState } from "../../assets/preact.esm.js";
import { ModalBackdrop, ModalContainer } from "./Modal.jsx";
import "./Lightbox.css";

export default function Lightbox({ selectedImage, imageDetails, onClose }) {
  const [currentImage, setCurrentImage] = useState(selectedImage);
  const [isZoomed, setIsZoomed] = useState(false);
  const [shouldShowZoom, setShouldShowZoom] = useState(false);

  if (!currentImage) {
    return null;
  }

  useEffect(() => {
    const viewportHeight = window.innerHeight * 0.95;
    const viewportWidth = window.innerWidth * 0.95;
    const imageAspectRatio = currentImage.aspectRatio;

    const scaledHeight = viewportWidth / imageAspectRatio;

    setShouldShowZoom(scaledHeight > viewportHeight);
    setIsZoomed(false);
  }, [currentImage]);

  useEffect(() => {
    function handleKeyDown(e) {
      const currentIndex = imageDetails.findIndex(img => img.filename === currentImage.filename);

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) {
            setCurrentImage(imageDetails[currentIndex - 1]);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < imageDetails.length - 1) {
            setCurrentImage(imageDetails[currentIndex + 1]);
          }
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentImage, imageDetails, onClose]);


  function handleImageClick() {
    if (shouldShowZoom) {
      setIsZoomed(!isZoomed);
    }
  }

  return (
    <ModalBackdrop onClose={onClose} isCentered={true}>
      <ModalContainer className={`lightbox ${isZoomed ? 'zoomed' : ''}`}>
        <div className="lightbox-image-container">
          <img
            src={currentImage.url}
            alt=""
            className={`lightbox-image ${shouldShowZoom ? 'zoomable' : ''}`}
            onClick={handleImageClick}
          />
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}
