const STORAGE_KEY = 'canvas';

function saveCanvasState(canvasData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(canvasData));
  } catch (e) {
    console.error('Failed to save canvas state:', e);
  }
}

function loadCanvasState() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { nodes: [], edges: [] };
  } catch (e) {
    console.error('Failed to load canvas state:', e);
    return { nodes: [], edges: [] };
  }
}

export default { saveCanvasState, loadCanvasState };
