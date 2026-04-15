const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 150;

function computePreview(canvasData) {
  if (!canvasData || !canvasData.nodes || canvasData.nodes.length === 0) {
    return { nodes: [], width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, nodeCount: 0 };
  }

  const nodes = canvasData.nodes;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const sourceNodes = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const x = node.x;
    const y = node.y;
    const w = node.width || 0;
    const h = node.height || 0;

    let type = 'note';
    if (node._zenMeta) {
      if (node._zenMeta.isSticky === true) {
        type = 'sticky';
      }
    }
    if (node.type === 'file') {
      type = 'image';
    }

    sourceNodes.push({ x, y, w, h, type });

    if (x < minX) { minX = x; }
    if (y < minY) { minY = y; }
    if (x + w > maxX) { maxX = x + w; }
    if (y + h > maxY) { maxY = y + h; }
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  if (contentWidth === 0 || contentHeight === 0) {
    const previewNodes = sourceNodes.map(n => ({
      x: 0, y: 0, w: 10, h: 10, type: n.type
    }));
    return { nodes: previewNodes, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, nodeCount: nodes.length };
  }

  const scaleX = PREVIEW_WIDTH / contentWidth;
  const scaleY = PREVIEW_HEIGHT / contentHeight;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const offsetX = (PREVIEW_WIDTH - scaledWidth) / 2;
  const offsetY = (PREVIEW_HEIGHT - scaledHeight) / 2;

  const previewNodes = sourceNodes.map(n => ({
    x: Math.round((n.x - minX) * scale + offsetX),
    y: Math.round((n.y - minY) * scale + offsetY),
    w: Math.max(4, Math.round(n.w * scale)),
    h: Math.max(4, Math.round(n.h * scale)),
    type: n.type
  }));

  return {
    nodes: previewNodes,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    nodeCount: nodes.length
  };
}

export default { computePreview };
