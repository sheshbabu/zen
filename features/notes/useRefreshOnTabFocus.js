import { useEffect, useRef } from "../../assets/preact.esm.js";
import ApiClient from '../../commons/http/ApiClient.js';

const MIN_CHECK_INTERVAL = 30000;

export default function useRefreshOnTabFocus({ note, isEditable, onRefresh }) {
  const lastCheckedAtRef = useRef(0);
  const isEditableRef = useRef(isEditable);
  isEditableRef.current = isEditable;

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible" || isEditable || !note || !navigator.onLine) {
        return;
      }

      const now = Date.now();
      if (now - lastCheckedAtRef.current < MIN_CHECK_INTERVAL) {
        return;
      }
      lastCheckedAtRef.current = now;

      ApiClient.getNoteById(note.noteId)
        .then(latestNote => {
          // Edit mode may have started while the request was in flight, and replacing content then would clobber typing.
          if (isEditableRef.current || latestNote.updatedAt === note.updatedAt) {
            return;
          }
          onRefresh(latestNote);
        })
        .catch(() => { });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [note, isEditable, onRefresh]);
}
