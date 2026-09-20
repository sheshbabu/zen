import { useEffect, useCallback } from "../../assets/preact.esm.js";

const listPatterns = [
  /^(\s*)(- \[ \] )/,
  /^(\s*)(- \[x\] )/,
  /^(\s*)(- )/,
  /^(\s*)(\* )/,
  /^(\s*)(\+ )/,
  /^(\s*)(\d+\. )/,
];

function isListLine(line) {
  return listPatterns.some(pattern => pattern.test(line));
}

function updateLine(textarea, lineStart, newLine, newCursorPos) {
  const lineEnd = textarea.value.indexOf('\n', lineStart);
  const textAfter = lineEnd === -1 ? "" : textarea.value.substring(lineEnd);
  textarea.value = textarea.value.substring(0, lineStart) + newLine + textAfter;
  textarea.selectionStart = newCursorPos;
  textarea.selectionEnd = newCursorPos;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

export default function useEditorKeyboardShortcuts({
  isEditable,
  isModal,
  isExpanded,
  isExpandable,
  textareaRef,
  onSave,
  onEdit,
  onClose,
  onExpandToggle,
  onInsertAtCursor,
  onFormatText
}) {
  const handleKeyDown = useCallback(e => {
    const isTextAreaFocused = document.activeElement.className == "notes-editor-textarea";

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isEditable === true) {
        onSave();
      } else {
        onEdit();
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (isModal === true) {
        onClose();
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
      if (isExpandable === true) {
        e.preventDefault();
        onExpandToggle();
      }
    }

    if (isTextAreaFocused && e.key === 'Tab') {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const lineStart = textarea.value.lastIndexOf('\n', cursorPos - 1) + 1;
      const lineEnd = textarea.value.indexOf('\n', cursorPos);
      const currentLine = textarea.value.substring(lineStart, lineEnd === -1 ? textarea.value.length : lineEnd);

      if (isListLine(currentLine)) {
        e.preventDefault();
        const indentation = currentLine.match(/^\s*/)[0];

        if (e.shiftKey) {
          const removedCount = Math.min(indentation.length, 2);
          if (removedCount === 0) {
            return;
          }
          const newCursorPos = Math.max(lineStart, cursorPos - removedCount);
          updateLine(textarea, lineStart, currentLine.substring(removedCount), newCursorPos);
        } else {
          updateLine(textarea, lineStart, '  ' + currentLine, cursorPos + 2);
        }
        return;
      }

      if (!e.shiftKey) {
        e.preventDefault();
        onInsertAtCursor('  ');
      }
    }

    if (isTextAreaFocused && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
      e.preventDefault();
      onFormatText("highlight");
    }

    if (isTextAreaFocused && (e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      onFormatText("bold");
    }

    if (isTextAreaFocused && (e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      onFormatText("italic");
    }

    if (isTextAreaFocused && e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      for (const pattern of listPatterns) {
        const match = currentLine.match(pattern);
        if (match) {
          e.preventDefault();
          const indentation = match[1];
          let prefix = match[2];
          const lineContent = currentLine.substring(match[0].length);

          // Empty list item: remove the prefix and end the list
          if (lineContent.trim() === "") {
            const lineStart = textBeforeCursor.length - currentLine.length;
            const textBefore = textarea.value.substring(0, lineStart);
            const textAfter = textarea.value.substring(cursorPos);
            const newValue = textBefore + "\n" + textAfter;
            const newCursorPos = lineStart + 1;
            textarea.value = newValue;
            textarea.selectionStart = newCursorPos;
            textarea.selectionEnd = newCursorPos;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return;
          }

          if (prefix === "- [x] ") {
            prefix = "- [ ] ";
          }
          else if (/^\d+\. $/.test(prefix)) {
            const num = parseInt(prefix.match(/^(\d+)/)[1]) + 1;
            prefix = `${num}. `;
          }

          const newLineText = `\n${indentation}${prefix}`;
          onInsertAtCursor(newLineText);
          return;
        }
      }
    }
  }, [isEditable, isModal, isExpanded, isExpandable, textareaRef, onSave, onEdit, onClose, onExpandToggle, onInsertAtCursor, onFormatText]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return { handleKeyDown };
}