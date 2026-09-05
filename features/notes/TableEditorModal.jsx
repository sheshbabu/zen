import { h, useState } from "../../assets/preact.esm.js"
import { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from "../../commons/components/Modal.jsx";
import Button from "../../commons/components/Button.jsx";
import buildMarkdownTable from "../../commons/utils/buildMarkdownTable.js";
import parseMarkdownTable from "../../commons/utils/parseMarkdownTable.js";
import "./TableEditorModal.css";

const EMPTY_TABLE = [["", "", ""], ["", "", ""], ["", "", ""]];

export default function TableEditorModal({ isEditing = false, selectedText = "", beforeText = "", afterText = "", onConfirm, onCloseClick }) {
  const [table] = useState(function () {
    if (!isEditing) {
      return null;
    }

    return parseMarkdownTable(selectedText);
  });

  let initialRows = EMPTY_TABLE;
  let alignments = [];

  if (table !== null) {
    initialRows = table.rows;
    alignments = table.alignments;
  }

  const [rows, setRows] = useState(initialRows);

  function handleCellInput(rowIndex, columnIndex, value) {
    const nextRows = rows.map(row => row.slice());
    nextRows[rowIndex][columnIndex] = value;
    setRows(nextRows);
  }

  function handleAddRowClick() {
    const newRow = rows[0].map(() => "");
    setRows([...rows, newRow]);
  }

  function handleRemoveRowClick() {
    if (rows.length <= 1) {
      return;
    }

    setRows(rows.slice(0, -1));
  }

  function handleAddColumnClick() {
    setRows(rows.map(row => [...row, ""]));
  }

  function handleRemoveColumnClick() {
    if (rows[0].length <= 1) {
      return;
    }

    setRows(rows.map(row => row.slice(0, -1)));
  }

  function handleConfirmClick() {
    const tableMarkdown = buildMarkdownTable(rows, alignments);
    onConfirm(getPadding(beforeText, true) + tableMarkdown + getPadding(afterText, false));
  }

  // Tables need a blank line on either side, otherwise markdown-it treats the
  // rows as a continuation of the surrounding paragraph and skips the table
  function getPadding(text, isBefore) {
    let hasBlankLine = text.startsWith("\n\n");
    let hasNewline = text.startsWith("\n");

    if (isBefore) {
      hasBlankLine = text.endsWith("\n\n");
      hasNewline = text.endsWith("\n");
    }

    if (text === "" || hasBlankLine) {
      return "";
    }

    if (hasNewline) {
      return "\n";
    }

    return "\n\n";
  }

  const headerCells = rows[0].map((cell, columnIndex) => (
    <th key={columnIndex}>
      <input type="text" value={cell} onInput={e => handleCellInput(0, columnIndex, e.target.value)} />
    </th>
  ));

  const bodyRows = rows.slice(1).map((row, index) => {
    const rowIndex = index + 1;
    const cells = row.map((cell, columnIndex) => (
      <td key={columnIndex}>
        <input type="text" value={cell} onInput={e => handleCellInput(rowIndex, columnIndex, e.target.value)} />
      </td>
    ));

    return <tr key={rowIndex}>{cells}</tr>;
  });

  let title = "Insert Table";
  let confirmLabel = "Insert";

  if (isEditing) {
    title = "Edit Table";
    confirmLabel = "Update";
  }

  const canRemoveRow = rows.length > 1;
  const canRemoveColumn = rows[0].length > 1;

  if (isEditing && table === null) {
    return (
      <ModalBackdrop onClose={onCloseClick}>
        <ModalContainer className="table-editor-modal">
          <ModalHeader title={title} onClose={onCloseClick} />
          <ModalContent>
            <p className="modal-description">Select a whole table to edit it.</p>
          </ModalContent>
          <ModalFooter isRightAligned>
            <Button onClick={onCloseClick}>Close</Button>
          </ModalFooter>
        </ModalContainer>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClose={onCloseClick}>
      <ModalContainer className="table-editor-modal">
        <ModalHeader title={title} onClose={onCloseClick} />
        <ModalContent>
          <div className="table-editor-actions">
            <Button variant="ghost" onClick={handleAddRowClick}>Add Row</Button>
            <Button variant="ghost" onClick={handleAddColumnClick}>Add Column</Button>
            <Button variant="ghost" onClick={handleRemoveRowClick} isDisabled={!canRemoveRow}>Remove Row</Button>
            <Button variant="ghost" onClick={handleRemoveColumnClick} isDisabled={!canRemoveColumn}>Remove Column</Button>
          </div>
          <div className="table-editor-grid">
            <table>
              <thead>
                <tr>{headerCells}</tr>
              </thead>
              <tbody>{bodyRows}</tbody>
            </table>
          </div>
        </ModalContent>
        <ModalFooter isRightAligned>
          <Button onClick={onCloseClick}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmClick}>{confirmLabel}</Button>
        </ModalFooter>
      </ModalContainer>
    </ModalBackdrop>
  );
}
