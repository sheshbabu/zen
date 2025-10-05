// JSON Canvas format conversion utilities
// Spec: https://jsoncanvas.org/spec/1.0/

function toJsonCanvas(nodesData, viewport) {
  const sortedNodes = [...nodesData].sort((a, b) => {
    return a.group.zIndex() - b.group.zIndex();
  });

  const nodes = sortedNodes.map(node => {
    const pos = node.group.position();
    const size = node.group.size();

    if (node.type === 'note') {
      const noteContent = node.item.content || node.item.matchText || node.item.snippet || '';
      const title = node.item.title || node.item.name || '';
      const fullText = title ? `# ${title}\n\n${noteContent}` : noteContent;

      return {
        id: `note-${node.item.noteId}`,
        type: 'text',
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        text: fullText,
        _zenMeta: {
          noteId: node.item.noteId,
        },
      };
    } else if (node.type === 'image') {
      return {
        id: `image-${node.item.filename}`,
        type: 'file',
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        file: `images/${node.item.filename}`,
        _zenMeta: {
          aspectRatio: node.item.aspectRatio,
        },
      };
    }
  });

  const canvas = {
    nodes: nodes.filter(n => n !== undefined),
    edges: [],
  };

  if (viewport) {
    canvas._zenViewport = viewport;
  }

  return canvas;
}

function fromJsonCanvas(canvasData) {
  if (!canvasData?.nodes) {
    return { nodes: [], viewport: null };
  }

  const nodes = canvasData.nodes.map(nodeData => {
    if (nodeData.type === 'text' && nodeData._zenMeta?.noteId) {
      return {
        type: 'note',
        x: nodeData.x,
        y: nodeData.y,
        width: nodeData.width,
        height: nodeData.height,
        item: {
          noteId: nodeData._zenMeta.noteId,
          title: nodeData._zenMeta.title || '',
          content: nodeData.text || '',
          tags: nodeData._zenMeta.tags || [],
          isPinned: nodeData._zenMeta.isPinned || false,
        },
      };
    } else if (nodeData.type === 'file' && nodeData.file) {
      const filename = nodeData.file.replace('images/', '');
      return {
        type: 'image',
        x: nodeData.x,
        y: nodeData.y,
        width: nodeData.width,
        height: nodeData.height,
        item: {
          filename: filename,
          aspectRatio: nodeData._zenMeta?.aspectRatio || 1.5,
        },
      };
    }
  }).filter(n => n !== undefined);

  return {
    nodes,
    viewport: canvasData._zenViewport || null,
  };
}

export default { toJsonCanvas, fromJsonCanvas };
