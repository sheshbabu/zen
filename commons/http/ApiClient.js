async function request(method, url, payload) {
  const options = {
    method: method,
    headers: {}
  };

  if (payload instanceof FormData) {
    options.body = payload;
  } else if (payload) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const isJsonResponse = response.headers.get('content-type')?.includes('application/json');
  const body = isJsonResponse ? await response.json() : null;

  if (!response.ok) {
    if (isJsonResponse) {
      const error = new Error(response.statusText);
      error.code = body.code;
      throw error;
    }
    throw new Error(response.statusText);
  }

  return body;
}

// Users

async function checkUser() {
  return await request('GET', '/api/users/me');
}

async function createUser(payload) {
  return await request('POST', '/api/users/new', payload);
}

async function login(payload) {
  return await request('POST', '/api/users/login', payload);
}

// Focus Modes

async function getFocusModes() {
  return await request('GET', '/api/focus');
}

async function createFocusMode(focusMode) {
  return await request('POST', '/api/focus/new', focusMode);
}

async function updateFocusMode(focusMode) {
  return await request('PUT', `/api/focus/${focusMode.focusId}`, focusMode);
}

// Notes

async function getNotes(tagId, focusId, isArchived, isDeleted, page) {
  let url = "/api/notes/";
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

async function getNoteById(noteId) {
  return await request('GET', `/api/notes/${noteId}`);
}

async function createNote(note) {
  return await request('POST', '/api/notes/', note);
}

async function updateNote(noteId, note) {
  return await request('PUT', `/api/notes/${noteId}`, note);
}

async function deleteNote(noteId) {
  return await request('DELETE', `/api/notes/${noteId}`);
}

async function restoreNote(noteId) {
  return await request('PUT', `/api/notes/${noteId}/restore/`);
}

async function archiveNote(noteId) {
  return await request('PUT', `/api/notes/${noteId}/archive/`);
}

async function unarchiveNote(noteId) {
  return await request('PUT', `/api/notes/${noteId}/unarchive/`);
}

// Tags

async function getTags(focusId) {
  let url = "/api/tags";

  if (focusId) {
    url += `?focusId=${focusId}`;
  }

  return await request('GET', url);
}

async function searchTags(query) {
  return await request('GET', `/api/tags?query=${query}`);
}

async function updateTag(tag) {
  return await request('PUT', `/api/tags/${tag.tagId}`, tag);
}

async function deleteTag(tagId) {
  return await request('DELETE', `/api/tags/${tagId}`);
}

// Images

async function uploadImage(formData) {
  return await request('POST', '/api/images/', formData);
}

// Search

async function search(query) {
  return await request('GET', `/api/search?query=${query}`);
}

export default {
  request,
  checkUser,
  createUser,
  login,
  getFocusModes,
  createFocusMode,
  updateFocusMode,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  archiveNote,
  unarchiveNote,
  getTags,
  searchTags,
  updateTag,
  deleteTag,
  uploadImage,
  search
};