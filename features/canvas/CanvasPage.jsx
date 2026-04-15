import { h, useEffect, useRef, useState } from '../../assets/preact.esm.js';
import useKonva from './useKonva.js';
import NoteNode from './NoteNode.js';
import ImageNode from './ImageNode.js';
import StickyNoteNode from './StickyNoteNode.js';
import CanvasNotePicker from './CanvasNotePicker.jsx';
import CanvasToolbar from './CanvasToolbar.jsx';
import JsonCanvas from './JsonCanvas.js';
import CanvasPreview from './CanvasPreview.js';
import ViewportManager from './ViewportManager.js';
import SelectionManager from './SelectionManager.js';
import TransformerManager from './TransformerManager.js';
import NodePositioning from './NodePositioning.js';
import ApiClient from '../../commons/http/ApiClient.js';
import navigateTo from '../../commons/utils/navigateTo.js';
import Lightbox from '../../commons/components/Lightbox.jsx';
import NotesEditorModal from '../notes/NotesEditorModal.jsx';
import { AppProvider } from '../../commons/contexts/AppContext.jsx';
import { NotesProvider } from '../../commons/contexts/NotesContext.jsx';
import { openModal, closeModal } from '../../commons/components/Modal.jsx';
import './CanvasPage.css';

export default function CanvasPage({ canvasId }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const isKonvaReady = useKonva();
  const [items, setItems] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasMultiSelection, setHasMultiSelection] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState('');
  const isPanModeRef = useRef(false);
  const nodesRef = useRef([]);
  const stickyNoteCounterRef = useRef(0);
  const viewportManagerRef = useRef(null);
  const selectionManagerRef = useRef(null);
  const transformerManagerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const canvasIdRef = useRef(canvasId);

  useEffect(() => {
    if (containerRef.current === null || isKonvaReady !== true) {
      return;
    }

    const canvasWidth = window.innerWidth;
    const stage = new window.Konva.Stage({
      container: containerRef.current,
      width: canvasWidth,
      height: window.innerHeight - 48,
    });

    const layer = new window.Konva.Layer();
    stage.add(layer);

    layer.draw();

    stageRef.current = { stage, layer };

    function handleViewportChange(scale) {
      setZoomLevel(scale);
      debouncedSave();
    }

    const viewportManager = ViewportManager.createViewportManager(stage, layer, handleViewportChange);
    viewportManagerRef.current = viewportManager;

    const selectionManager = SelectionManager.createSelectionManager(stage, layer, nodesRef);
    selectionManager.initialize();
    selectionManagerRef.current = selectionManager;

    const transformerManager = TransformerManager.createTransformerManager(stage, layer, nodesRef, debouncedSave);
    transformerManager.initialize();
    transformerManagerRef.current = transformerManager;

    stage.on('mousedown', (e) => {
      if (e.target !== stage) {
        return;
      }

      const isShiftPressed = e.evt.shiftKey;
      const shouldPan = isPanModeRef.current || isShiftPressed;

      if (shouldPan) {
        viewportManager.startPan();
      } else {
        selectionManager.deselectAll();
        if (transformerManagerRef.current !== null) {
          transformerManagerRef.current.detach();
        }
        const pos = stage.getRelativePointerPosition();
        selectionManager.startSelection(pos);
      }
    });

    stage.on('mousemove', () => {
      if (viewportManager.updatePan()) {
        return;
      }

      selectionManager.updateSelection();
    });

    stage.on('mouseup', () => {
      if (viewportManager.endPan()) {
        return;
      }

      const hadSelection = selectionManager.endSelection();
      if (hadSelection === true) {
        const selectedNodes = selectionManager.getSelectedNodes();
        if (transformerManagerRef.current !== null) {
          transformerManagerRef.current.attachToNodes(Array.from(selectedNodes));
        }
        setHasMultiSelection(selectedNodes.size >= 2);
      }
    });

    ApiClient.getCanvasById(canvasIdRef.current)
      .then(canvas => {
        if (canvas) {
          setCanvasTitle(canvas.title || '');
          canvas.data = canvas.data ? JSON.parse(canvas.data) : { nodes: [], edges: [] };
        }
        const canvasData = canvas ? canvas.data : { nodes: [], edges: [] };
        const restored = JsonCanvas.fromJsonCanvas(canvasData);

        if (restored.viewport) {
          viewportManager.setViewport(restored.viewport);
          setZoomLevel(restored.viewport.scale);
        } else {
          stage.scale({ x: 0.75, y: 0.75 });
          setZoomLevel(0.75);
        }

        if (restored.nodes.length > 0) {
          const addedItemIds = new Set();
          restored.nodes.forEach(nodeData => {
            if (nodeData.type === 'note') {
              const group = NoteNode.create(layer, nodeData.item, nodeData.x, nodeData.y, debouncedSave, handleNodeClick, handleNoteDoubleClick, nodeData.width, nodeData.height);
              addedItemIds.add(nodeData.item.noteId);
              nodesRef.current.push({ id: nodeData.item.noteId, group, item: nodeData.item, type: 'note' });
            } else if (nodeData.type === 'image') {
              const group = ImageNode.create(layer, nodeData.item, nodeData.x, nodeData.y, debouncedSave, handleNodeClick, handleImageDoubleClick, nodeData.width, nodeData.height);
              addedItemIds.add(nodeData.item.filename);
              nodesRef.current.push({ id: nodeData.item.filename, group, item: nodeData.item, type: 'image' });
            } else if (nodeData.type === 'sticky') {
              const group = StickyNoteNode.create(layer, nodeData.x, nodeData.y, debouncedSave, handleNodeClick, handleStickyNoteClick, nodeData.width, nodeData.height, nodeData.item.text);
              nodesRef.current.push({ id: nodeData.item.id, group, item: nodeData.item, type: 'sticky' });
            }
          });
          setItems(addedItemIds);
          layer.draw();

          syncNoteNodes(layer);
        }
      });

    function handleResize() {
      const newCanvasWidth = isSidebarOpen ? window.innerWidth - 400 : window.innerWidth;
      stage.width(newCanvasWidth);
      stage.height(window.innerHeight - 48);
    }

    function handleKeyDown(e) {
      const tag = e.target.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable === true;

      if ((e.key === 'Delete' || e.key === 'Backspace') && isTyping !== true) {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleToggleSidebar();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && isTyping !== true) {
        e.preventDefault();
        handleDuplicateSelected();
      }
    }

    stage.on('wheel', viewportManager.handleWheel);

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      flushPendingSave();
      nodesRef.current = [];
      stage.destroy();
    };
  }, [isKonvaReady]);

  useEffect(() => {
    if (stageRef.current === null) {
      return
    }
    const stage = stageRef.current.stage;
    const newCanvasWidth = isSidebarOpen ? window.innerWidth - 400 : window.innerWidth;
    stage.width(newCanvasWidth);
    stageRef.current.layer.draw();
  }, [isSidebarOpen]);

  function getCanvasData() {
    if (stageRef.current === null || viewportManagerRef.current === null) {
      return null;
    }
    const viewport = viewportManagerRef.current.getViewport();
    return JsonCanvas.toJsonCanvas(nodesRef.current, viewport);
  }

  function debouncedSave() {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      const canvasData = getCanvasData();
      if (canvasData === null) {
        return;
      }
      const preview = CanvasPreview.computePreview(canvasData);
      ApiClient.updateCanvas(canvasIdRef.current, {
        data: JSON.stringify(canvasData),
        preview: JSON.stringify(preview),
      });
    }, 2000);
  }

  function flushPendingSave() {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      const canvasData = getCanvasData();
      if (canvasData === null) {
        return;
      }
      const preview = CanvasPreview.computePreview(canvasData);
      ApiClient.updateCanvas(canvasIdRef.current, {
        data: JSON.stringify(canvasData),
        preview: JSON.stringify(preview),
      }, { keepalive: true });
    }
  }

  function syncNoteNodes(layer) {
    const noteNodes = nodesRef.current.filter(n => n.type === 'note');
    if (noteNodes.length === 0) {
      return;
    }

    const promises = noteNodes.map(n =>
      ApiClient.getNoteById(n.item.noteId)
        .then(note => ({ status: 'fulfilled', noteId: n.item.noteId, note }))
        .catch(() => ({ status: 'rejected', noteId: n.item.noteId }))
    );

    Promise.all(promises).then(results => {
      let hasChanges = false;

      results.forEach(result => {
        const nodeIndex = nodesRef.current.findIndex(n => n.type === 'note' && n.item.noteId === result.noteId);
        if (nodeIndex === -1) {
          return;
        }

        const nodeData = nodesRef.current[nodeIndex];

        if (result.status === 'rejected') {
          if (nodeData.item.isDeleted !== true) {
            nodeData.item.isDeleted = true;
            const oldGroup = nodeData.group;
            const x = oldGroup.x();
            const y = oldGroup.y();
            const width = oldGroup.width();
            const height = oldGroup.height();
            oldGroup.destroy();
            const newGroup = NoteNode.create(layer, nodeData.item, x, y, debouncedSave, handleNodeClick, handleNoteDoubleClick, width, height);
            nodeData.group = newGroup;
            hasChanges = true;
          }
        } else if (result.status === 'fulfilled') {
          const note = result.note;
          const oldItem = nodeData.item;
          const hasItemChanges = oldItem.title !== note.title || oldItem.content !== note.content || oldItem.isDeleted === true;

          if (hasItemChanges) {
            nodeData.item = note;
            const oldGroup = nodeData.group;
            const x = oldGroup.x();
            const y = oldGroup.y();
            const width = oldGroup.width();
            const height = oldGroup.height();
            oldGroup.destroy();
            const newGroup = NoteNode.create(layer, note, x, y, debouncedSave, handleNodeClick, handleNoteDoubleClick, width, height);
            nodeData.group = newGroup;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        layer.draw();
        debouncedSave();
      }
    });
  }

  function handleNodeClick(group, e) {
    group.moveToTop();

    selectionManagerRef.current.handleNodeClick(group, e);

    if (transformerManagerRef.current !== null) {
      const selectedNodes = selectionManagerRef.current.getSelectedNodes();
      transformerManagerRef.current.attachToNodes(Array.from(selectedNodes));
      setHasMultiSelection(selectedNodes.size >= 2);
    }

    if (stageRef.current !== null) {
      stageRef.current.layer.draw();
    }
  }

  function handleDeleteSelected() {
    if (selectionManagerRef.current === null || stageRef.current === null) {
      return;
    }

    const selectedNodes = selectionManagerRef.current.getSelectedNodes();
    if (selectedNodes.size === 0) {
      return;
    }

    const nodesToDelete = Array.from(selectedNodes);
    const idsToDelete = new Set();

    nodesToDelete.forEach(nodeGroup => {
      const nodeData = nodesRef.current.find(n => n.group === nodeGroup);
      if (nodeData) {
        idsToDelete.add(nodeData.id);
        nodeGroup.destroy();
        const index = nodesRef.current.indexOf(nodeData);
        if (index !== -1) {
          nodesRef.current.splice(index, 1);
        }
      }
    });

    setItems(prev => {
      const newItems = new Set(prev);
      idsToDelete.forEach(id => newItems.delete(id));
      return newItems;
    });

    selectionManagerRef.current.deselectAll();
    if (transformerManagerRef.current !== null) {
      transformerManagerRef.current.detach();
    }
    setHasMultiSelection(false);
    stageRef.current.layer.draw();
    debouncedSave();
  }

  function handleDuplicateSelected() {
    if (selectionManagerRef.current === null || stageRef.current === null) {
      return;
    }

    const selectedNodes = selectionManagerRef.current.getSelectedNodes();
    if (selectedNodes.size === 0) {
      return;
    }

    const { layer } = stageRef.current;
    const nodesToDuplicate = Array.from(selectedNodes);
    const newGroups = [];

    selectionManagerRef.current.deselectAll();
    if (transformerManagerRef.current !== null) {
      transformerManagerRef.current.detach();
    }

    nodesToDuplicate.forEach(nodeGroup => {
      const nodeData = nodesRef.current.find(n => n.group === nodeGroup);
      if (nodeData !== undefined) {
        const offsetX = 20;
        const offsetY = 20;
        const newX = nodeGroup.x() + offsetX;
        const newY = nodeGroup.y() + offsetY;

        let newGroup;
        if (nodeData.type === 'note') {
          newGroup = NoteNode.create(
            layer,
            nodeData.item,
            newX,
            newY,
            debouncedSave,
            handleNodeClick,
            handleNoteDoubleClick,
            nodeGroup.width(),
            nodeGroup.height()
          );
          nodesRef.current.push({ id: nodeData.item.noteId, group: newGroup, item: nodeData.item, type: 'note' });
        } else if (nodeData.type === 'image') {
          newGroup = ImageNode.create(
            layer,
            nodeData.item,
            newX,
            newY,
            debouncedSave,
            handleNodeClick,
            handleImageDoubleClick,
            nodeGroup.width(),
            nodeGroup.height()
          );
          nodesRef.current.push({ id: nodeData.item.filename, group: newGroup, item: nodeData.item, type: 'image' });
        } else if (nodeData.type === 'sticky') {
          const text = StickyNoteNode.getText(nodeGroup);
          const newId = `sticky-${Date.now()}-${stickyNoteCounterRef.current++}`;
          newGroup = StickyNoteNode.create(
            layer,
            newX,
            newY,
            debouncedSave,
            handleNodeClick,
            handleStickyNoteClick,
            nodeGroup.width(),
            nodeGroup.height(),
            text
          );
          nodesRef.current.push({ id: newId, group: newGroup, item: { id: newId, text }, type: 'sticky' });
        }

        if (newGroup !== undefined) {
          newGroup.setSelected(true);
          newGroups.push(newGroup);
          selectionManagerRef.current.getSelectedNodes().add(newGroup);
        }
      }
    });

    if (transformerManagerRef.current !== null && newGroups.length > 0) {
      transformerManagerRef.current.attachToNodes(newGroups);
    }

    setHasMultiSelection(newGroups.length >= 2);
    layer.draw();
    debouncedSave();
  }

  function handleAddNote(item) {
    if (stageRef.current === null) {
      return;
    }

    const { layer, stage } = stageRef.current;

    if (item.noteId) {
      const nodeWidth = 500;
      const cardHeight = item.title && item.title.length > 0 ? 360 : 340;
      const { x, y } = NodePositioning.findRandomUnoccupiedPosition(stage, nodesRef, nodeWidth, cardHeight);

      const group = NoteNode.create(layer, item, x, y, debouncedSave, handleNodeClick, handleNoteDoubleClick);
      layer.draw();
      const itemId = item.noteId;
      setItems(prev => new Set(prev).add(itemId));
      nodesRef.current.push({ id: itemId, group, item, type: 'note' });
      debouncedSave();
    } else if (item.filename) {
      const thumbnailWidth = 500;
      const thumbnailHeight = thumbnailWidth / item.aspectRatio;
      const { x, y } = NodePositioning.findRandomUnoccupiedPosition(stage, nodesRef, thumbnailWidth, thumbnailHeight);

      const group = ImageNode.create(layer, item, x, y, debouncedSave, handleNodeClick, handleImageDoubleClick);
      layer.draw();
      const itemId = item.filename;
      setItems(prev => new Set(prev).add(itemId));
      nodesRef.current.push({ id: itemId, group, item, type: 'image' });
      debouncedSave();
    }
  }

  function handleBack() {
    navigateTo('/canvases/');
  }

  function handleTitleChange(newTitle) {
    setCanvasTitle(newTitle);
    ApiClient.updateCanvas(canvasIdRef.current, { title: newTitle });
  }

  function handleZoom(type) {
    if (stageRef.current === null) {
      return;
    }

    const stage = stageRef.current.stage;

    if (type === 'in') {
      const newScale = Math.min(5, stage.scaleX() * 1.2);
      stage.scale({ x: newScale, y: newScale });
      setZoomLevel(newScale);
    } else if (type === 'out') {
      const newScale = Math.max(0.1, stage.scaleX() / 1.2);
      stage.scale({ x: newScale, y: newScale });
      setZoomLevel(newScale);
    } else if (type === 'reset') {
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      setZoomLevel(1);
    }

    stageRef.current.layer.draw();
    debouncedSave();
  }

  function handleSelectAll() {
    if (selectionManagerRef.current === null) return;

    nodesRef.current.forEach(node => {
      node.group.setSelected(true);
      selectionManagerRef.current.getSelectedNodes().add(node.group);
    });

    if (transformerManagerRef.current !== null) {
      const selectedNodes = selectionManagerRef.current.getSelectedNodes();
      transformerManagerRef.current.attachToNodes(Array.from(selectedNodes));
    }

    if (stageRef.current !== null) {
      stageRef.current.layer.draw();
    }
  }

  function handleToggleSidebar() {
    setIsSidebarOpen(prev => !prev);
  }

  function handleTogglePanMode() {
    setIsPanMode(prev => {
      isPanModeRef.current = !prev;
      return !prev;
    });
  }

  function handleAddStickyNote() {
    if (stageRef.current === null) {
      return;
    }

    const { layer, stage } = stageRef.current;
    const nodeWidth = 250;
    const nodeHeight = 250;
    const { x, y } = NodePositioning.findRandomUnoccupiedPosition(stage, nodesRef, nodeWidth, nodeHeight);

    const id = `sticky-${Date.now()}-${stickyNoteCounterRef.current++}`;
    const group = StickyNoteNode.create(layer, x, y, debouncedSave, handleNodeClick, handleStickyNoteClick);

    nodesRef.current.push({ id, group, item: { id, text: '' }, type: 'sticky' });
    layer.draw();
    debouncedSave();

    const textNode = group.findOne('Text');
    if (textNode) {
      handleStickyNoteClick(group, textNode);
    }
  }

  function handleStickyNoteClick(group, textNode) {
    const stage = stageRef.current.stage;
    stage.container().style.cursor = 'text';

    const areaPosition = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    textNode.hide();
    stageRef.current.layer.draw();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y + stageBox.top}px`;
    textarea.style.left = `${areaPosition.x + stageBox.left}px`;
    textarea.style.width = `${textNode.width()}px`;
    textarea.style.height = `${textNode.height()}px`;
    textarea.style.fontSize = '18px';
    textarea.style.border = 'none';
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();

    const rotation = group.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }

    const px = 0;
    const py = 0;
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      transform += `translateY(-${py + 2}px)`;
    }

    textarea.style.transform = transform;
    textarea.style.height = 'auto';

    textarea.focus();

    function removeTextarea() {
      textarea.parentNode.removeChild(textarea);
      stage.container().style.cursor = 'default';
      textNode.text(textarea.value);
      textNode.show();
      StickyNoteNode.setText(group, textarea.value);
      stageRef.current.layer.draw();
      debouncedSave();
    }

    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        removeTextarea();
      }
    });

    textarea.addEventListener('blur', removeTextarea);
  }

  function handleImageDoubleClick(imageItem) {
    const imageWithUrl = {
      url: `/images/${imageItem.filename}`,
      width: imageItem.width,
      height: imageItem.height,
      aspectRatio: imageItem.aspectRatio,
      filename: imageItem.filename,
    };

    function handleCloseLightbox() {
      closeModal();
    }

    openModal(
      <Lightbox
        selectedImage={imageWithUrl}
        imageDetails={[imageWithUrl]}
        onClose={handleCloseLightbox}
      />
    );
  }

  function handleNoteDoubleClick(noteItem) {
    ApiClient.getNoteById(noteItem.noteId)
      .then(note => {
        function handleModalClose() {
          ApiClient.getNoteById(noteItem.noteId)
            .then(updatedNote => {
              const nodeIndex = nodesRef.current.findIndex(n => n.id === noteItem.noteId);
              if (nodeIndex === -1 || stageRef.current === null) {
                return;
              }

              const oldNode = nodesRef.current[nodeIndex];
              const { layer } = stageRef.current;
              const x = oldNode.group.x();
              const y = oldNode.group.y();
              const width = oldNode.group.width();
              const height = oldNode.group.height();

              oldNode.group.destroy();

              const newGroup = NoteNode.create(layer, updatedNote, x, y, debouncedSave, handleNodeClick, handleNoteDoubleClick, width, height);
              nodesRef.current[nodeIndex] = { id: updatedNote.noteId, group: newGroup, item: updatedNote, type: 'note' };

              layer.draw();
              debouncedSave();
            })
            .catch(() => { });
        }

        openModal(
          <AppProvider>
            <NotesProvider>
              <NotesEditorModal note={note} onModalClose={handleModalClose} />
            </NotesProvider>
          </AppProvider>,
          '.note-modal-root'
        );
      })
      .catch(() => { });
  }

  function handleAlign(type) {
    if (selectionManagerRef.current === null || stageRef.current === null) {
      return;
    }

    const selectedNodes = Array.from(selectionManagerRef.current.getSelectedNodes());
    if (selectedNodes.length < 2) {
      return;
    }

    if (type === 'top') {
      const minY = Math.min(...selectedNodes.map(node => node.y()));
      selectedNodes.forEach(node => node.y(minY));
    } else if (type === 'left') {
      const minX = Math.min(...selectedNodes.map(node => node.x()));
      selectedNodes.forEach(node => node.x(minX));
    } else if (type === 'center-horizontal') {
      const ys = selectedNodes.map(node => node.y() + node.height() / 2);
      const avgY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
      selectedNodes.forEach(node => node.y(avgY - node.height() / 2));
    } else if (type === 'center-vertical') {
      const xs = selectedNodes.map(node => node.x() + node.width() / 2);
      const avgX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
      selectedNodes.forEach(node => node.x(avgX - node.width() / 2));
    } else if (type === 'bottom') {
      const maxY = Math.max(...selectedNodes.map(node => node.y() + node.height()));
      selectedNodes.forEach(node => node.y(maxY - node.height()));
    } else if (type === 'right') {
      const maxX = Math.max(...selectedNodes.map(node => node.x() + node.width()));
      selectedNodes.forEach(node => node.x(maxX - node.width()));
    }

    stageRef.current.layer.draw();
    debouncedSave();
  }

  let content;
  if (isKonvaReady !== true) {
    content = <div className="canvas-loading">Loading...</div>;
  } else {
    content = <div ref={containerRef} className="canvas-container" />;
  }

  return (
    <div className="canvas-page">
      <CanvasToolbar
        onBack={handleBack}
        title={canvasTitle}
        onTitleChange={handleTitleChange}
        onDelete={handleDeleteSelected}
        onDuplicate={handleDuplicateSelected}
        onZoom={handleZoom}
        zoomLevel={zoomLevel}
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onTogglePanMode={handleTogglePanMode}
        isPanMode={isPanMode}
        onAlign={handleAlign}
        hasMultiSelection={hasMultiSelection}
        onAddStickyNote={handleAddStickyNote}
      />
      {content}
      {isSidebarOpen && <CanvasNotePicker onAddNote={handleAddNote} addedItems={items} />}
      <div className="note-modal-root"></div>
      <div className="modal-root"></div>
    </div>
  );
}