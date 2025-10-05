import { h, useEffect, useRef, useState } from '../../assets/preact.esm.js';
import useKonva from './useKonva.js';
import NoteNode from './NoteNode.js';
import ImageNode from './ImageNode.js';
import CanvasNotePicker from './CanvasNotePicker.jsx';
import JsonCanvas from './JsonCanvas.js';
import ViewportManager from './ViewportManager.js';
import SelectionManager from './SelectionManager.js';
import NodePositioning from './NodePositioning.js';
import CanvasStorage from './CanvasStorage.js';
import './CanvasPage.css';

export default function CanvasPage() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const isKonvaReady = useKonva();
  const [items, setItems] = useState(new Set());
  const nodesRef = useRef([]);
  const viewportManagerRef = useRef(null);
  const selectionManagerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current === null || isKonvaReady !== true) {
      return;
    }

    const canvasWidth = window.innerWidth - 400;
    const stage = new window.Konva.Stage({
      container: containerRef.current,
      width: canvasWidth,
      height: window.innerHeight,
    });

    const layer = new window.Konva.Layer();
    stage.add(layer);

    layer.draw();

    stageRef.current = { stage, layer };

    const viewportManager = ViewportManager.createViewportManager(stage, layer);
    viewportManagerRef.current = viewportManager;

    const selectionManager = SelectionManager.createSelectionManager(stage, layer, nodesRef);
    selectionManager.initialize();
    selectionManagerRef.current = selectionManager;

    stage.on('mousedown', (e) => {
      if (e.target !== stage) {
        return;
      }

      const isShiftPressed = e.evt.shiftKey;

      if (isShiftPressed) {
        viewportManager.startPan();
      } else {
        selectionManager.deselectAll();
        const pos = stage.getPointerPosition();
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

      selectionManager.endSelection();
    });

    const savedCanvas = CanvasStorage.loadCanvasState();
    const restored = JsonCanvas.fromJsonCanvas(savedCanvas);

    viewportManager.setViewport(restored.viewport);

    if (restored.nodes.length > 0) {
      const addedItemIds = new Set();
      restored.nodes.forEach(nodeData => {
        if (nodeData.type === 'note') {
          const group = NoteNode.create(layer, nodeData.item, nodeData.x, nodeData.y, saveCanvasStateFromNodesRef, handleNodeClick);
          addedItemIds.add(nodeData.item.noteId);
          nodesRef.current.push({ id: nodeData.item.noteId, group, item: nodeData.item, type: 'note' });
        } else if (nodeData.type === 'image') {
          const group = ImageNode.create(layer, nodeData.item, nodeData.x, nodeData.y, saveCanvasStateFromNodesRef, handleNodeClick);
          addedItemIds.add(nodeData.item.filename);
          nodesRef.current.push({ id: nodeData.item.filename, group, item: nodeData.item, type: 'image' });
        }
      });
      setItems(addedItemIds);
      layer.draw();
    }

    function handleResize() {
      const newCanvasWidth = window.innerWidth - 400;
      stage.width(newCanvasWidth);
      stage.height(window.innerHeight);
    }

    function handleKeyDown(e) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    }

    stage.on('wheel', viewportManager.handleWheel);

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      stage.destroy();
    };
  }, [isKonvaReady]);

  function saveCanvasStateFromNodesRef() {
    if (stageRef.current === null || viewportManagerRef.current === null) {
      return;
    }

    const viewport = viewportManagerRef.current.getViewport();
    const canvasData = JsonCanvas.toJsonCanvas(nodesRef.current, viewport);
    CanvasStorage.saveCanvasState(canvasData);
  }

  function handleNodeClick(group, e) {
    selectionManagerRef.current.handleNodeClick(group, e);
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
    stageRef.current.layer.draw();
    saveCanvasStateFromNodesRef();
  }

  function handleAddNote(item) {
    if (stageRef.current === null) {
      return;
    }

    const { layer, stage } = stageRef.current;

    if (item.noteId) {
      const nodeWidth = 376;
      const cardHeight = item.title && item.title.length > 0 ? 280 : 260;
      const { x, y } = NodePositioning.findRandomUnoccupiedPosition(stage, nodesRef, nodeWidth, cardHeight);

      const group = NoteNode.create(layer, item, x, y, saveCanvasStateFromNodesRef, handleNodeClick);
      layer.draw();
      const itemId = item.noteId;
      setItems(prev => new Set(prev).add(itemId));
      nodesRef.current.push({ id: itemId, group, item, type: 'note' });
      saveCanvasStateFromNodesRef();
    } else if (item.filename) {
      const thumbnailWidth = 376;
      const thumbnailHeight = thumbnailWidth / item.aspectRatio;
      const { x, y } = NodePositioning.findRandomUnoccupiedPosition(stage, nodesRef, thumbnailWidth, thumbnailHeight);

      const group = ImageNode.create(layer, item, x, y, saveCanvasStateFromNodesRef, handleNodeClick);
      layer.draw();
      const itemId = item.filename;
      setItems(prev => new Set(prev).add(itemId));
      nodesRef.current.push({ id: itemId, group, item, type: 'image' });
      saveCanvasStateFromNodesRef();
    }
  }

  let content;
  if (isKonvaReady !== true) {
    content = <div className="canvas-loading">Loading...</div>;
  } else {
    content = <div ref={containerRef} className="canvas-container" />;
  }

  return (
    <div className="canvas-page">
      {content}
      <CanvasNotePicker onAddNote={handleAddNote} addedItems={items} />
    </div>
  );
}