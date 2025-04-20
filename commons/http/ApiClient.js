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

async function getAllFocusModes() {
  return await request('GET', '/api/focus');
}

async function createFocusMode() {
  return await request('POST', '/api/focus/new');
}

// Notes

async function getAllNotes() {
  return await request('GET', '/api/notes');
}

async function getNoteById(noteId) {
  return await request('GET', `/api/notes/${noteId}`);
}

async function getNotesByTagId(tagId) {
  return await request('GET', `/api/notes?tag_id=${tagId}`);
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

async function getAllTags() {
  return await request('GET', '/api/tags');
}

async function searchTags(query) {
  return await request('GET', `/api/tags?query=${query}`);
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
  getAllFocusModes,
  createFocusMode,
  getAllNotes,
  getNoteById,
  getNotesByTagId,
  createNote,
  updateNote,
  deleteNote,
  getAllTags,
  searchTags,
  uploadImage,
  search
};