import { h, useEffect, useRef, useState, useCallback, Fragment } from "../../assets/preact.esm.js";
import { closeModal, openModal } from "../../commons/components/Modal.jsx";
import Lightbox from "../../commons/components/Lightbox.jsx";
import "./ImageGallery.css";

const MIN_COLUMN_WIDTH = 300;
const GUTTER_WIDTH = 20;
const GUTTER_HEIGHT = 20;

export default function ImageGallery({ images }) {
  const [imageDetails, setImageDetails] = useState([]);

  const containerRef = useRef(null);

  useEffect(() => {
    if (images.length === 0) {
      setImageDetails([]);
      return;
    }

    const processedFilenames = imageDetails.map(detail => detail.filename);
    const newImages = images.filter(image => !processedFilenames.includes(image.filename));

    if (newImages.length === 0) {
      return;
    }

    const newDetails = newImages.map(image => ({
      url: `/images/${image.filename}`,
      width: image.width,
      height: image.height,
      aspectRatio: image.aspectRatio,
      filename: image.filename,
    }));

    setImageDetails(prev => [...prev, ...newDetails]);
    initLayout();
  }, [images]);

  useEffect(() => {
    if (imageDetails.length > 0) {
      layout();
    }
  }, [imageDetails]);

  const layout = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    const containerWidth = containerRef.current.clientWidth;
    const [columnWidth, gutter, columnCount] = calculateColumns(containerWidth);
    const items = containerRef.current.children;
    const heights = new Array(columnCount).fill(0);

    Array.from(items).forEach((item, index) => {
      const imageDetail = imageDetails[index];
      if (!imageDetail) {
        return;
      }

      const shortestColumnIndex = getShortestColumnIndex(heights);
      const x = shortestColumnIndex * (columnWidth + gutter);
      const y = heights[shortestColumnIndex];

      const height = columnWidth / imageDetail.aspectRatio;

      item.style.position = 'absolute';
      item.style.left = x + 'px';
      item.style.top = y + 'px';
      item.style.width = columnWidth + 'px';
      item.style.height = height + 'px';

      heights[shortestColumnIndex] = y + height + GUTTER_HEIGHT;
    });

    containerRef.current.style.height = Math.max(...heights) + 'px';
  }, [imageDetails]);

  const handleResize = useCallback(() => {
    initLayout();
    layout();
  }, [layout]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  function initLayout() {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.style.position = 'relative';
  }

  // columnWidth, gutterWidth, columnCount
  function calculateColumns(containerWidth) {
    if (containerWidth <= MIN_COLUMN_WIDTH) {
      return [containerWidth, 0, 1];
    }

    const columnCount = Math.floor(containerWidth / (MIN_COLUMN_WIDTH + GUTTER_WIDTH));
    let columnWidth = containerWidth / columnCount;
    columnWidth = columnWidth - GUTTER_WIDTH;
    return [columnWidth, GUTTER_WIDTH, columnCount];
  }

  function getShortestColumnIndex(heights) {
    const minHeight = Math.min(...heights);
    return heights.indexOf(minHeight);
  }

  function handleImageClick(selectedImage) {
    openModal(<Lightbox selectedImage={selectedImage} imageDetails={imageDetails} onClose={closeLightbox} />);
  }

  function closeLightbox() {
    closeModal();
  }

  const items = imageDetails.map((image, index) => {
    return (
      <img 
        key={image.filename} 
        src={image.url} 
        loading="lazy" 
        className="image-gallery-item" 
        onLoad={e => e.target.classList.add('loaded')}
        onClick={() => handleImageClick(image)}
      />
    );
  });

  return (
    <div ref={containerRef} className="image-gallery">
      {items}
    </div>
  );
}

