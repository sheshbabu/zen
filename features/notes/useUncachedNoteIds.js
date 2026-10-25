import { useState, useEffect } from "../../assets/preact.esm.js";

export default function useUncachedNoteIds(notes) {
  const [uncachedNoteIds, setUncachedNoteIds] = useState(new Set());

  useEffect(() => {
    function checkCache() {
      // Online, every note can be opened, so nothing should be dimmed.
      // Cache Storage only exists on secure origins, so a plain http install has nothing to show.
      if (navigator.onLine || window.caches === undefined) {
        setUncachedNoteIds(new Set());
        return;
      }

      const lookups = notes.map(note => caches.match(`/api/v1/notes/${note.noteId}/`));
      Promise.all(lookups).then(responses => {
        const ids = notes.filter((note, index) => responses[index] === undefined).map(note => note.noteId);
        setUncachedNoteIds(new Set(ids));
      });
    }

    checkCache();
    window.addEventListener('online', checkCache);
    window.addEventListener('offline', checkCache);

    return () => {
      window.removeEventListener('online', checkCache);
      window.removeEventListener('offline', checkCache);
    };
  }, [notes]);

  return uncachedNoteIds;
}
