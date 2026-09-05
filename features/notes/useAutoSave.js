import ApiClient from '../../commons/http/ApiClient.js';
import useDebounce from '../../commons/utils/useDebounce.js';
import AutoSavePreferences from '../../commons/preferences/AutoSavePreferences.js';

const AUTO_SAVE_DELAY = 2000;

export default function useAutoSave({ isNewNote, noteId, titleRef, textareaRef, tagsRef }) {
  function save() {
    if (isNewNote || noteId === undefined) {
      return;
    }

    if (AutoSavePreferences.isEnabled() === false) {
      return;
    }

    if (titleRef.current === null || textareaRef.current === null) {
      return;
    }

    const note = {
      title: titleRef.current.textContent,
      content: textareaRef.current.value,
      tags: tagsRef.current || [],
    };

    ApiClient.updateNote(noteId, note).catch(() => {
      // Auto-save is best effort; the content stays in the editor to be retried
    });
  }

  const { schedule, cancel } = useDebounce(save, AUTO_SAVE_DELAY);

  return {
    scheduleAutoSave: schedule,
    cancelAutoSave: cancel
  };
}
