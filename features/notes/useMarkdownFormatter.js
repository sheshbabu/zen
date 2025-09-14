function useMarkdownFormatter({ textareaRef, setContent }) {
  function insertAtCursor(text) {
    if (textareaRef.current === null) {
      return;
    }

    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, startPos);
    const afterText = textarea.value.substring(endPos);

    setContent(beforeText + text + afterText);

    // Use setTimeout to ensure cursor position is set after DOM update
    const newPosition = startPos + text.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  }

  function formatSelectedText(format) {
    applyMarkdownFormat(format);
  }

  function applyMarkdownFormat(format, placeholder = "") {
    if (textareaRef.current === null) {
      return;
    }

    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, startPos);
    const afterText = textarea.value.substring(endPos);
    const selectedText = textarea.value.substring(startPos, endPos);

    let formattedText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText || placeholder}**`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case "italic":
        formattedText = `*${selectedText || placeholder}*`;
        cursorOffset = selectedText ? formattedText.length : 1;
        break;
      case "strikethrough":
        formattedText = `~~${selectedText || placeholder}~~`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case "highlight":
        formattedText = `==${selectedText || placeholder}==`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case "code":
        formattedText = `\`${selectedText || placeholder}\``;
        cursorOffset = selectedText ? formattedText.length : 1;
        break;
      case "h1":
        formattedText = `# ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case "h2":
        formattedText = `## ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 3;
        break;
      case "h3":
        formattedText = `### ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 4;
        break;
      case "ul":
        formattedText = `- ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case "ol":
        formattedText = `1. ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 3;
        break;
      case "todo":
        formattedText = `- [ ] ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 6;
        break;
      case "quote":
        formattedText = `> ${selectedText || placeholder}`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case "hr":
        formattedText = `\n---\n`;
        cursorOffset = formattedText.length;
        break;
      case "link":
        if (selectedText) {
          formattedText = `[${selectedText}](url)`;
          cursorOffset = formattedText.length - 4; // Position cursor at "url"
        } else {
          formattedText = `[${placeholder}](url)`;
          cursorOffset = 1; // Position cursor at placeholder
        }
        break;
    }

    setContent(beforeText + formattedText + afterText);

    // Set cursor position after content update
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = startPos + cursorOffset;
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  }

  return {
    insertAtCursor,
    formatSelectedText,
    applyMarkdownFormat
  };
}

export default useMarkdownFormatter;