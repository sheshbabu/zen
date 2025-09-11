// ...existing imports...

function forceDeleteNote(noteId) {
  return fetch(`/api/notes/${noteId}/force-delete`, {
    method: 'POST'
  }).then(resp => {
    if (!resp.ok) throw new Error("Force delete failed");
    return resp;
  });
}

// ...other existing exports...
export default {
  // ...your existing exports...
  forceDeleteNote,
};