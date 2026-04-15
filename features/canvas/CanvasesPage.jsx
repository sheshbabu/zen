import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import CanvasesToolbar from './CanvasesToolbar.jsx';
import CanvasDeleteModal from './CanvasDeleteModal.jsx';
import Spinner from '../../commons/components/Spinner.jsx';
import EmptyState from '../../commons/components/EmptyState.jsx';
import { BoardIcon, TrashIcon } from '../../commons/components/Icon.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import navigateTo from "../../commons/utils/navigateTo.js";
import formatDate from "../../commons/utils/formatDate.js";
import { openModal, closeModal } from "../../commons/components/Modal.jsx";
import { showToast } from "../../commons/components/Toast.jsx";
import "./CanvasesPage.css";

export default function CanvasesPage() {
  const [canvases, setCanvases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshCanvases();
  }, []);

  function refreshCanvases() {
    setIsLoading(true);
    ApiClient.getCanvases()
      .then(allCanvases => {
        setCanvases(allCanvases);
      })
      .catch(error => {
        console.error('Error loading canvases:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleNewCanvasClick() {
    ApiClient.createCanvas({ title: 'Untitled Canvas' })
      .then(canvas => {
        navigateTo(`/canvases/${canvas.canvasId}`);
      })
      .catch(() => {
        showToast('Failed to create canvas');
      });
  }

  function handleDeleteCloseClick() {
    closeModal();
  }

  function handleDeleteCanvas(e, canvasId) {
    e.stopPropagation();
    openModal(
      <CanvasDeleteModal
        onDeleteClick={() => handleDeleteConfirmClick(canvasId)}
        onCloseClick={handleDeleteCloseClick}
      />
    );
  }

  function handleDeleteConfirmClick(canvasId) {
    ApiClient.deleteCanvas(canvasId)
      .then(() => {
        closeModal();
        refreshCanvases();
      })
      .catch(() => {
        showToast('Failed to delete canvas');
      });
  }

  function handleCanvasClick(canvasId) {
    navigateTo(`/canvases/${canvasId}`);
  }

  let content;
  if (isLoading === true) {
    content = <div className="canvases-spinner"><Spinner /></div>;
  } else if (canvases.length === 0) {
    content = <EmptyState icon={<BoardIcon />} title="No canvases" description="Create a canvas to spatially organize your notes" />;
  } else {
    const canvasCards = canvases.map(canvas => (
      <CanvasCard
        key={canvas.canvasId}
        canvas={canvas}
        onClick={() => handleCanvasClick(canvas.canvasId)}
        onDelete={(e) => handleDeleteCanvas(e, canvas.canvasId)}
      />
    ));

    content = <div className="canvases-grid">{canvasCards}</div>;
  }

  return (
    <div className="page-container">
      <Sidebar isOpen={true} onSidebarClose={() => { }} />

      <div className="canvases-page-content">
        <CanvasesToolbar onNewCanvasClick={handleNewCanvasClick} />
        {content}
      </div>

      <div className="modal-root"></div>
      <div className="toast-root"></div>
    </div>
  );
}

function CanvasCard({ canvas, onClick, onDelete }) {
  let preview = null;
  try {
    const previewData = JSON.parse(canvas.preview);
    if (previewData.nodes && previewData.nodes.length > 0) {
      const previewNodes = previewData.nodes.map((node, i) => {
        let bgColor = '#FFFFFF';
        let borderColor = '#E5E5E5';

        if (node.type === 'sticky') {
          bgColor = '#FEF08A';
          borderColor = '#FACC15';
        } else if (node.type === 'image') {
          bgColor = '#E5E5E5';
          borderColor = '#D4D4D4';
        }

        return (
          <div
            key={i}
            className="canvas-card-preview-node"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${node.w}px`,
              height: `${node.h}px`,
              backgroundColor: bgColor,
              borderColor: borderColor,
            }}
          />
        );
      });

      preview = (
        <div className="canvas-card-preview" style={{ width: `${previewData.width}px`, height: `${previewData.height}px` }}>
          {previewNodes}
        </div>
      );
    }
  } catch (e) {
    // ignore parse errors
  }

  if (preview === null) {
    preview = <div className="canvas-card-preview canvas-card-preview-empty" />;
  }

  const updatedAt = formatDate(new Date(canvas.updatedAt));

  return (
    <div className="canvas-card" onClick={onClick}>
      {preview}
      <div className="canvas-card-info">
        <div className="canvas-card-title">{canvas.title || 'Untitled Canvas'}</div>
        <div className="canvas-card-meta">
          <span className="canvas-card-date">{updatedAt}</span>
          <button className="canvas-card-delete" onClick={onDelete} title="Delete">
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
