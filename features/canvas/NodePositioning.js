function findRandomUnoccupiedPosition(stage, nodesRef, nodeWidth, nodeHeight) {
  const canvasWidth = stage.width();
  const canvasHeight = stage.height();
  const margin = 20;
  const maxAttempts = 50;

  for (let i = 0; i < maxAttempts; i++) {
    const x = margin + Math.random() * (canvasWidth - nodeWidth - margin * 2);
    const y = margin + Math.random() * (canvasHeight - nodeHeight - margin * 2);

    const candidateBox = {
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
    };

    const hasIntersection = nodesRef.current.some(node => {
      const nodeBox = node.group.getClientRect();
      return window.Konva.Util.haveIntersection(candidateBox, nodeBox);
    });

    if (hasIntersection !== true) {
      return { x, y };
    }
  }

  const centerX = canvasWidth / 2 - nodeWidth / 2;
  const centerY = canvasHeight / 2 - nodeHeight / 2;
  return { x: centerX, y: centerY };
}

export default { findRandomUnoccupiedPosition };
