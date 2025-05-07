import { h, useEffect, useRef, useState } from "../../assets/preact.esm.js";
import Link from '../../commons/components/Link.jsx';

export default function ImageGallery({ notes, columnWidth = 200, gutter = 0 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [columnHeights, setColumnHeights] = useState([]);
  const [imageDetails, setImageDetails] = useState([]);

  const containerRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const images = extractImagesFromNotes(notes);
    // Get image dimensions without rendering
    Promise.all(
      images.map(image =>
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
    ).then(details => {
      setImageDetails(details);
      initLayout();
      setIsLoading(false);
    });

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [notes]);

  useEffect(() => {
    if (columnHeights.length > 0 && imageDetails.length > 0) {
      layout();
    }
  }, [imageDetails]);

  function handleResize() {
    initLayout();
  }

  function initLayout() {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.style.position = 'relative';

    const containerWidth = containerRef.current.clientWidth;
    const totalColumnWidth = columnWidth + gutter;
    let columnCount = Math.floor((containerWidth + gutter) / totalColumnWidth);
    columnCount = Math.max(columnCount, 1);

    setColumnHeights(new Array(columnCount).fill(0));
  }

  function getShortestColumnIndex(heights) {
    const minHeight = Math.min(...heights);
    return heights.indexOf(minHeight);
  }

  function layout() {
    if (!containerRef.current) {
      return;
    }

    const items = containerRef.current.children;
    const newColumnHeights = [...columnHeights];

    Array.from(items).forEach((item, index) => {
      const imageDetail = imageDetails[index];
      if (!imageDetail) {
        return;
      }

      const shortestColumnIndex = getShortestColumnIndex(newColumnHeights);
      const x = shortestColumnIndex * (columnWidth + gutter);
      const y = newColumnHeights[shortestColumnIndex];

      const height = columnWidth / imageDetail.aspectRatio;

      item.style.position = 'absolute';
      item.style.left = x + 'px';
      item.style.top = y + 'px';
      item.style.width = columnWidth + 'px';
      item.style.height = height + 'px';

      newColumnHeights[shortestColumnIndex] = y + height + gutter;
    });

    setColumnHeights(newColumnHeights);
    containerRef.current.style.height = Math.max(...newColumnHeights) + 'px';
  }

  const items = imageDetails.map((image, index) => {
    const link = `/notes/${image.noteId}`;
    return (
      <Link to={link} shouldPreserveSearchParams>
        <img key={index} src={image.url} loading="lazy" className="image-gallery-item" onLoad={e => e.target.classList.add('loaded')} />
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
  if (images.length > 0) {
    return null;
  }

  return <div className="image-gallery-empty-text">No images found</div>
}