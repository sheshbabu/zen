import { h, useEffect, useRef, useState, useCallback } from "../../assets/preact.esm.js";
import Link from '../../commons/components/Link.jsx';

const MIN_COLUMN_WIDTH = 300;
const GUTTER_WIDTH = 20;
const GUTTER_HEIGHT = 20;

export default function ImageGallery({ notes }) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageDetails, setImageDetails] = useState([]);

  const containerRef = useRef(null);

  useEffect(() => {
    if (notes.length === 0) {
      setImageDetails([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const processedNoteIds = imageDetails.map(detail => detail.noteId);
    const newNotes = notes.filter(note => !processedNoteIds.includes(note.noteId));

    if (newNotes.length === 0) {
      setIsLoading(false);
      return;
    }

    const newImages = extractImagesFromNotes(newNotes);

    // Get image dimensions without rendering
    Promise.all(
      newImages.map(image =>
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            resolve({
              url: image.url,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height,
              noteId: image.noteId,
            });
          };
          img.src = image.url;
        })
      )
    ).then(newDetails => {
      setImageDetails(prev => [...prev, ...newDetails]);
      initLayout();
      setIsLoading(false);
    });
  }, [notes]);

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

  const items = imageDetails.map((image, index) => {
    const link = `/notes/${image.noteId}`;
    return (
      <Link key={index} to={link} shouldPreserveSearchParams>
        <img src={image.url} loading="lazy" className="image-gallery-item" onLoad={e => e.target.classList.add('loaded')} />
      </Link>
    );
  });

  if (items.length === 0 && !isLoading) {
    return (
      <div ref={containerRef} className="image-gallery">
        <EmptyList images={imageDetails} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="image-gallery">
      {items}
    </div>
  );
}

function extractImagesFromNotes(notes) {
  const images = [];

  notes.forEach(note => {
    // ![](/images/xxx.png)
    const matches = note.content.match(/!\[\]\(\/images\/[\w.-]+\.(?:png|jpg|jpeg|gif)\)/g);

    if (!matches) {
      return;
    }

    matches.forEach(match => {
      const url = match.match(/\/images\/[\w.-]+\.(?:png|jpg|jpeg|gif)/)[0];
      images.push({
        url,
        noteId: note.noteId,
        noteTitle: note.title
      });
    });
  });

  return images;
}

function EmptyList({ images }) {
  return <div className="image-gallery-empty-text">No images found</div>
}