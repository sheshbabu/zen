import { h, useEffect, useState } from "../../assets/preact.esm.js";
import { ModalBackdrop, ModalContainer } from "./Modal.jsx";
import ApiClient from "../http/ApiClient.js";
import "./Lightbox.css";

export default function Lightbox({ selectedImage, imageDetails, onClose }) {
  const [currentImage, setCurrentImage] = useState(selectedImage);
  const [isZoomed, setIsZoomed] = useState(false);
  const [shouldShowZoom, setShouldShowZoom] = useState(false);
  const [similarImages, setSimilarImages] = useState([]);
  const [isSimilarImagesVisible, setIsSimilarImagesVisible] = useState(false);

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

    setSimilarImages([]);
    ApiClient.getSimilarImages(currentImage.filename)
      .then(results => {
        setSimilarImages(results);
      })
      .catch(err => {
        console.error('Failed to fetch similar images:', err);
      });
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

  function handleSimilarImagesClick() {
    setIsSimilarImagesVisible(!isSimilarImagesVisible);
  }

  function handleSimilarImageClick(image) {
    const imageWithUrl = {
      url: `/images/${image.filename}`,
      width: image.width,
      height: image.height,
      aspectRatio: image.aspectRatio,
      filename: image.filename,
    };
    setCurrentImage(imageWithUrl);
  }

  let similarImagesButton = null;
  if (similarImages.length > 0 && isZoomed === false) {
    const buttonText = isSimilarImagesVisible === true ? "Hide Similar Images" : "Similar Images";
    similarImagesButton = (
      <div className="lightbox-button-container">
        <button className="lightbox-similar-images-button" onClick={handleSimilarImagesClick}>
          {buttonText}
        </button>
      </div>
    );
  }

  let similarImagesGrid = null;
  if (isSimilarImagesVisible === true && similarImages.length > 0 && isZoomed === false) {
    const gridImages = similarImages.map(image => (
      <img
        key={image.filename}
        src={`/images/${image.filename}`}
        alt=""
        className="lightbox-similar-image"
        onClick={() => handleSimilarImageClick(image)}
      />
    ));

    similarImagesGrid = (
      <div className="lightbox-similar-images-grid">
        {gridImages}
      </div>
    );
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
        {similarImagesGrid}
        {similarImagesButton}
      </ModalContainer>
    </ModalBackdrop>
  );
}
