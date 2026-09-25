import { showToast } from "../components/Toast.jsx";

async function request(method, url, payload, opts) {
  const options = {
    method: method,
    headers: {},
    ...opts,
  };

  if (payload instanceof FormData) {
    options.body = payload;
  } else if (payload) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw response;
    }

    const isJsonResponse = response.headers.get('content-type')?.includes('application/json');
    return isJsonResponse ? await response.json() : null;
  } catch (error) {
    if (!navigator.onLine) {
      showToast("No internet connection.");
      console.error("Network error:", error);
      throw error;
    }

    if (error instanceof TypeError && (
      error.message.includes('fetch') ||
      error.message.includes('Load failed') ||
      error.message.includes('NetworkError')
    )) {
      showToast("Connection failed.");
      console.error("Fetch error:", error);
      throw error;
    }

    if (error instanceof Response) {
      const isJsonResponse = error.headers.get('content-type')?.includes('application/json');

      if (isJsonResponse) {
        const body = await error.json();
        const err = new Error(error.statusText);
        err.code = body?.code;

        const skipCodes = ['NO_USERS', 'NO_SESSION', 'INVALID_EMAIL', 'INVALID_PASSWORD', 'INCORRECT_EMAIL', 'INCORRECT_PASSWORD'];
        if (!skipCodes.includes(body?.code)) {
          const message = body?.message || 'An unexpected error occurred';
          showToast(message);
        }
        console.error('API error:', body);

        throw err;
      }

      showToast('An unexpected error occurred');
      throw new Error(error.statusText);
    }

    throw error;
  }
}

// Users

async function checkUser() {
  return await request('GET', '/api/v1/users/me');
}

async function createUser(payload) {
  return await request('POST', '/api/v1/users/new', payload);
}

async function login(payload) {
  return await request('POST', '/api/v1/users/login', payload);
}

async function updatePassword(payload) {
  return await request('POST', '/api/v1/users/me/password', payload);
}

async function logout() {
  const response = await request('POST', '/api/v1/users/logout');
  navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHE' });
  return response;
}

// Focus Modes

async function getFocusModes() {
  return await request('GET', '/api/v1/focus');
}

async function createFocusMode(focusMode) {
  return await request('POST', '/api/v1/focus/new', focusMode);
}

async function updateFocusMode(focusMode) {
  return await request('PUT', `/api/v1/focus/${focusMode.focusId}`, focusMode);
}

async function deleteFocusMode(focusId) {
  return await request('DELETE', `/api/v1/focus/${focusId}/`);
}

// Notes

async function getNotes(tagId, focusId, isArchived, isDeleted, page) {
  let url = "/api/v1/notes/";
  const params = new URLSearchParams();

  if (tagId) {
    params.append('tagId', tagId);
  } else if (focusId) {
    params.append('focusId', focusId);
  }

  if (page) {
    params.append('page', page);
  }

  if (isArchived) {
    params.append('isArchived', "true");
  } else if (isDeleted) {
    params.append('isDeleted', "true");
  }

  if (params.toString()) {
    url += '?' + params.toString();
  }

  return await request('GET', url);
}

async function getRelatedNotes(noteId, limit) {
  let url = `/api/v1/notes/${noteId}/related/`;
  if (limit) {
    url += `?limit=${limit}`;
  }
  return await request('GET', url);
}

async function getNoteById(noteId) {
  return await request('GET', `/api/v1/notes/${noteId}/`);
}

async function createNote(note) {
  return await request('POST', '/api/v1/notes/', note);
}

async function updateNote(noteId, note) {
  return await request('PUT', `/api/v1/notes/${noteId}/`, note);
}

async function deleteNote(noteId) {
  return await request('DELETE', `/api/v1/notes/${noteId}/`);
}

async function bulkDeleteNotes(ids) {
  return await request('DELETE', '/api/v1/notes/bulk/', { ids });
}

async function restoreNote(noteId) {
  return await request('PUT', `/api/v1/notes/${noteId}/restore/`);
}

async function archiveNote(noteId) {
  return await request('PUT', `/api/v1/notes/${noteId}/archive/`);
}

async function bulkArchiveNotes(ids) {
  return await request('PUT', '/api/v1/notes/bulk/archive/', { ids });
}

async function unarchiveNote(noteId) {
  return await request('PUT', `/api/v1/notes/${noteId}/unarchive/`);
}

async function pinNote(noteId) {
  return await request('PUT', `/api/v1/notes/${noteId}/pin/`);
}

async function unpinNote(noteId) {
  return await request('PUT', `/api/v1/notes/${noteId}/unpin/`);
}

async function clearTrash() {
  return await request('DELETE', '/api/v1/notes/?isDeleted=true');
}

async function getNoteVersions(noteId, page) {
  let url = `/api/v1/notes/${noteId}/versions/`;
  const params = new URLSearchParams();

  if (page) {
    params.append('page', page);
  }

  if (params.toString()) {
    url += '?' + params.toString();
  }

  return await request('GET', url);
}

async function restoreNoteVersion(noteId, versionId) {
  return await request('PUT', `/api/v1/notes/${noteId}/versions/${versionId}/restore/`);
}

// Tags

async function getTags(focusId) {
  let url = "/api/v1/tags/";

  if (focusId) {
    url += `?focusId=${focusId}`;
  }

  return await request('GET', url);
}

async function searchTags(query) {
  return await request('GET', `/api/v1/tags/?query=${query}`);
}

async function updateTag(tag) {
  return await request('PUT', `/api/v1/tags/${tag.tagId}/`, tag);
}

async function deleteTag(tagId) {
  return await request('DELETE', `/api/v1/tags/${tagId}/`);
}

// Images

async function getImages(tagId, focusId, page) {
  let url = "/api/v1/images/";
  const params = new URLSearchParams();

  if (tagId) {
    params.append('tagId', tagId);
  } else if (focusId) {
    params.append('focusId', focusId);
  }

  if (page) {
    params.append('page', page);
  }

  if (params.toString()) {
    url += '?' + params.toString();
  }

  return await request('GET', url);
}

async function uploadImage(formData) {
  return await request('POST', '/api/v1/images/', formData);
}

// Search

async function search(query, sort) {
  return await request('GET', `/api/v1/search/?query=${query}&sort=${sort}`);
}

// Intelligence

async function getSimilarImages(filename) {
  return await request('GET', `/api/v1/intelligence/similarity/images/${filename}/`);
}

// Import

async function importFile(formData) {
  return await request('POST', '/api/v1/import/', formData);
}

// Export

async function exportNotes() {
  const response = await fetch('/api/v1/export/', {
    method: 'GET',
    headers: {}
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'zen-export.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Templates

async function getTemplates() {
  return await request('GET', "/api/v1/templates/");
}

async function getTemplateById(templateId) {
  return await request('GET', `/api/v1/templates/${templateId}/`);
}

async function createTemplate(template) {
  return await request('POST', '/api/v1/templates/', template);
}

async function updateTemplate(templateId, template) {
  return await request('PUT', `/api/v1/templates/${templateId}/`, template);
}

async function deleteTemplate(templateId) {
  return await request('DELETE', `/api/v1/templates/${templateId}/`);
}

async function getRecommendedTemplates() {
  return await request('GET', "/api/v1/templates/recommended/");
}

async function incrementTemplateUsage(templateId) {
  return await request('PUT', `/api/v1/templates/${templateId}/usage/`);
}


// API Tokens

async function getTokens() {
  return await request('GET', '/api/v1/tokens/');
}

async function createToken(payload) {
  return await request('POST', '/api/v1/tokens/', payload);
}

async function deleteToken(tokenId) {
  return await request('DELETE', `/api/v1/tokens/${tokenId}/`);
}

// Canvases

async function getCanvases() {
  return await request('GET', '/api/v1/canvases/');
}

async function getCanvasById(canvasId) {
  return await request('GET', `/api/v1/canvases/${canvasId}/`);
}

async function createCanvas(canvas) {
  return await request('POST', '/api/v1/canvases/', canvas);
}

async function updateCanvas(canvasId, canvas, opts) {
  return await request('PUT', `/api/v1/canvases/${canvasId}/`, canvas, opts);
}

async function deleteCanvas(canvasId) {
  return await request('DELETE', `/api/v1/canvases/${canvasId}/`);
}

export default {
  request,
  checkUser,
  createUser,
  login,
  updatePassword,
  logout,
  getFocusModes,
  createFocusMode,
  updateFocusMode,
  deleteFocusMode,
  getNotes,
  getRelatedNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  bulkDeleteNotes,
  restoreNote,
  archiveNote,
  bulkArchiveNotes,
  unarchiveNote,
  pinNote,
  unpinNote,
  clearTrash,
  getNoteVersions,
  restoreNoteVersion,
  getTags,
  searchTags,
  updateTag,
  deleteTag,
  getImages,
  uploadImage,
  search,
  getSimilarImages,
  importFile,
  exportNotes,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getRecommendedTemplates,
  incrementTemplateUsage,
  getTokens,
  createToken,
  deleteToken,
  getCanvases,
  getCanvasById,
  createCanvas,
  updateCanvas,
  deleteCanvas
};
