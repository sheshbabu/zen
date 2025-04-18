async function request(method, url, payload) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };

  const response = await fetch(url, options);
  return await response.json();
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



export default {
  request,
  getAllFocusModes,
  createFocusMode,
  getAllNotes,
  getNoteById,
  getNotesByTagId,
  createNote,
  updateNote,
  getAllTags,
  searchTags,
  uploadImage
};