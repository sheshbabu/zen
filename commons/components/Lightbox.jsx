import { h, useEffect, useState } from "../../assets/preact.esm.js";
import { ModalBackdrop, ModalContainer } from "./Modal.jsx";
import { CloseIcon, ImagesIcon, BackIcon } from "./Icon.jsx";
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
    setIsSimilarImagesVisible(false);
  }

  let mainContent = null;
  let buttonContainer = null;

  const shouldShowSimilarImagesButton = similarImages.length > 0 && isZoomed === false;

  if (isZoomed === false && isSimilarImagesVisible === true && similarImages.length > 0) {
    const gridImages = similarImages.map((image, index) => (
      <img
        key={image.filename}
        src={`/images/${image.filename}`}
        alt=""
        className="lightbox-similar-image reveal-animate"
        style={`--reveal-index: ${index + 1}`}
        onClick={() => handleSimilarImageClick(image)}
      />
    ));

    mainContent = (
      <div className="lightbox-similar-images-container">
        <div className="lightbox-similar-images-header">
          <div className="lightbox-similar-images-back" onClick={handleSimilarImagesClick}>
            <BackIcon />
          </div>
          <div className="lightbox-similar-images-title">Similar Images</div>
          <div className="lightbox-similar-images-close" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>
        <div className="lightbox-similar-images-grid">
          {gridImages}
        </div>
      </div>
    );
  } else {
    let similarImagesButton = null;
    if (shouldShowSimilarImagesButton === true) {
      similarImagesButton = (
        <div className="lightbox-similar-button" onClick={handleSimilarImagesClick}>
          <ImagesIcon />
        </div>
      );
    }

    mainContent = (
      <div className="lightbox-image-container">
        <img
          src={currentImage.url}
          alt=""
          className={shouldShowZoom === true ? 'lightbox-image zoomable' : 'lightbox-image'}
          onClick={handleImageClick}
        />
        <div className="lightbox-controls">
          {similarImagesButton}
          <div className="lightbox-close-button" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>
      </div>
    );

  }

  return (
    <ModalBackdrop onClose={onClose} isCentered={true}>
      <ModalContainer className={isZoomed === true ? 'lightbox zoomed' : 'lightbox'}>
        {mainContent}
        {buttonContainer}
      </ModalContainer>
    </ModalBackdrop>
  );
}
