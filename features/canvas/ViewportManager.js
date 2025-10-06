function createViewportManager(stage, layer, onViewportChange) {
  let isPanning = false;
  let lastPos = null;

  function handleWheel(e) {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    stage.position(newPos);
    layer.draw();

    if (onViewportChange) {
      onViewportChange(clampedScale);
    }
  }

  function startPan() {
    isPanning = true;
    lastPos = stage.getPointerPosition();
    stage.container().style.cursor = 'grabbing';
  }

  function updatePan() {
    if (isPanning !== true) {
      return false;
    }

    const pos = stage.getPointerPosition();
    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;

    stage.x(stage.x() + dx);
    stage.y(stage.y() + dy);

    lastPos = pos;
    layer.draw();
    return true;
  }

  function endPan() {
    if (isPanning !== true) {
      return false;
    }

    isPanning = false;
    lastPos = null;
    stage.container().style.cursor = 'default';

    if (onViewportChange) {
      onViewportChange(stage.scaleX());
    }

    return true;
  }

  function getViewport() {
    return {
      x: stage.x(),
      y: stage.y(),
      scale: stage.scaleX(),
    };
  }

  function setViewport(viewport) {
    if (viewport) {
      stage.x(viewport.x);
      stage.y(viewport.y);
      stage.scale({ x: viewport.scale, y: viewport.scale });
    }
  }

  return {
    handleWheel,
    startPan,
    updatePan,
    endPan,
    getViewport,
    setViewport,
  };
}

export default { createViewportManager };
