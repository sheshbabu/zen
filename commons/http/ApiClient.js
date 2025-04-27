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
  const type = response.headers.get('content-type');

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  
  if (type?.includes('application/json')) {
    return await response.json();
  }

  return null;
}

// Focus Modes

async function getFocusModes() {
  return await request('GET', '/api/focus');
}

async function createFocusMode(focusMode) {
  return await request('POST', '/api/focus/new', focusMode);
}

async function updateFocusMode(focusMode) {
  return await request('PUT', `/api/focus/${focusMode.focus_mode_id}`, focusMode);
}

// Notes

async function getNotes(tagId, focusId, page) {
  let url = "/api/notes/";
  const params = new URLSearchParams();

  if (tagId) {
    params.append('tag_id', tagId);
  } else if (focusId) {
    params.append('focus_id', focusId);
  }

  if (page) {
    params.append('page', page);
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

// Tags

async function getTags(focusId) {
  let url = "/api/tags";

  if (focusId) {
    url += `?focus_id=${focusId}`;
  }

  return await request('GET', url);
}

async function searchTags(query) {
  return await request('GET', `/api/tags?query=${query}`);
}

async function updateTag(tag) {
  return await request('PUT', `/api/tags/${tag.tag_id}`, tag);
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
  getFocusModes,
  createFocusMode,
  updateFocusMode,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getTags,
  searchTags,
  updateTag,
  deleteTag,
  uploadImage,
  search
};