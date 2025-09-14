import { useEffect, useCallback } from "../../assets/preact.esm.js";

export default function useEditorKeyboardShortcuts({
  isEditable,
  isFloating,
  isExpanded,
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
      if (isFloating === true) {
        onClose();
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
      e.preventDefault();
      onExpandToggle();
    }

    if (isTextAreaFocused && e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      onInsertAtCursor('  ');
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

      const listPatterns = [
        /^(\s*)(- \[ \] )/,
        /^(\s*)(- \[x\] )/,
        /^(\s*)(- )/,
        /^(\s*)(\* )/,
        /^(\s*)(\+ )/,
        /^(\s*)(\d+\. )/,
      ];

      for (const pattern of listPatterns) {
        const match = currentLine.match(pattern);
        if (match) {
          e.preventDefault();
          const indentation = match[1];
          let prefix = match[2];

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
  }, [isEditable, isFloating, isExpanded, textareaRef, onSave, onEdit, onClose, onExpandToggle, onInsertAtCursor, onFormatText]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return { handleKeyDown };
}