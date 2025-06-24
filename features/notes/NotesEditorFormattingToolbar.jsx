import { h } from "../../assets/preact.esm.js"
import { BoldIcon, ItalicIcon, StrikethroughIcon, HighlightIcon, CodeIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, ListTodoIcon, QuoteIcon, LinkIcon, SeparatorIcon } from '../../commons/components/Icon.jsx';

export default function NotesEditorFormattingToolbar({ isEditable, onFormat }) {
  if (!isEditable) {
    return null;
  }

  return (
    <div className="formatting-toolbar">
      <div className="formatting-toolbar-group">
        <button type="button" className="formatting-button" onClick={() => onFormat("bold", "bold text")} title="Bold (Ctrl+B)">
          <BoldIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("italic", "italic text")} title="Italic (Ctrl+I)">
          <ItalicIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("strikethrough", "strikethrough text")} title="Strikethrough">
          <StrikethroughIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("highlight", "highlight text")} title="Highlight (Ctrl+Shift+H)">
          <HighlightIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("code", "code")} title="Inline Code">
          <CodeIcon />
        </button>
      </div>

      <div className="formatting-toolbar-group">
        <button type="button" className="formatting-button" onClick={() => onFormat("h1", "Heading 1")} title="Heading 1">
          <Heading1Icon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("h2", "Heading 2")} title="Heading 2">
          <Heading2Icon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("h3", "Heading 3")} title="Heading 3">
          <Heading3Icon />
        </button>
      </div>

      <div className="formatting-toolbar-group">
        <button type="button" className="formatting-button" onClick={() => onFormat("ul", "list item")} title="Bullet List">
          <ListIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("ol", "list item")} title="Numbered List">
          <ListOrderedIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("todo", "todo item")} title="Todo List">
          <ListTodoIcon />
        </button>
      </div>

      <div className="formatting-toolbar-group">
        <button type="button" className="formatting-button" onClick={() => onFormat("quote", "quote text")} title="Quote">
          <QuoteIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("link", "link text")} title="Link">
          <LinkIcon />
        </button>
        <button type="button" className="formatting-button" onClick={() => onFormat("hr")} title="Horizontal Rule">
          <SeparatorIcon />
        </button>
      </div>
    </div>
  );
}