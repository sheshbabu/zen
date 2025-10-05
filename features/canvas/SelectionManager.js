function createSelectionManager(stage, layer, nodesRef) {
  const selectedNodes = new Set();
  let selectionRect = null;
  let selectionStart = null;

  function initialize() {
    selectionRect = new window.Konva.Rect({
      fill: 'rgba(250, 204, 21, 0.2)',
      stroke: '#FACC15',
      strokeWidth: 1,
      visible: false,
    });
    layer.add(selectionRect);
  }

  function startSelection(pos) {
    selectionStart = pos;
    selectionRect.visible(true);
    selectionRect.width(0);
    selectionRect.height(0);
    selectionRect.x(pos.x);
    selectionRect.y(pos.y);
  }

  function updateSelection() {
    if (selectionStart === null) {
      return false;
    }

    const pos = stage.getRelativePointerPosition();
    const x1 = selectionStart.x;
    const y1 = selectionStart.y;
    const x2 = pos.x;
    const y2 = pos.y;

    selectionRect.x(Math.min(x1, x2));
    selectionRect.y(Math.min(y1, y2));
    selectionRect.width(Math.abs(x2 - x1));
    selectionRect.height(Math.abs(y2 - y1));
    layer.draw();
    return true;
  }

  function endSelection() {
    if (selectionStart === null) {
      return false;
    }

    selectionStart = null;
    selectionRect.visible(false);

    const box = selectionRect.getClientRect();
    const intersectingNodes = nodesRef.current.filter(node => {
      const nodeBox = node.group.getClientRect();
      return window.Konva.Util.haveIntersection(box, nodeBox);
    });

    intersectingNodes.forEach(node => {
      node.group.setSelected(true);
      selectedNodes.add(node.group);
    });

    layer.draw();
    return true;
  }

  function handleNodeClick(group, e) {
    const isMultiSelect = e?.evt?.shiftKey || e?.evt?.metaKey || e?.evt?.ctrlKey;

    if (isMultiSelect !== true) {
      selectedNodes.forEach(node => {
        if (node !== group) {
          node.setSelected(false);
        }
      });
      selectedNodes.clear();
    }

    if (selectedNodes.has(group)) {
      group.setSelected(false);
      selectedNodes.delete(group);
    } else {
      group.setSelected(true);
      selectedNodes.add(group);
    }

    layer.draw();
  }

  function deselectAll() {
    selectedNodes.forEach(node => {
      node.setSelected(false);
    });
    selectedNodes.clear();
    layer.draw();
  }

  function getSelectedNodes() {
    return selectedNodes;
  }

  return {
    initialize,
    startSelection,
    updateSelection,
    endSelection,
    handleNodeClick,
    deselectAll,
    getSelectedNodes,
  };
}

export default { createSelectionManager };
