import { h } from "../../assets/preact.esm.js"
import { CloseIcon, ArchiveIcon, TrashIcon, FileCheckIcon } from '../../commons/components/Icon.jsx';
import ApiClient from '../../commons/http/ApiClient.js';
import { showToast } from '../../commons/components/Toast.jsx';
import { openModal, closeModal } from '../../commons/components/Modal.jsx';
import { useNotes } from '../../commons/contexts/NotesContext.jsx';
import BulkDeleteModal from './BulkDeleteModal.jsx';
import pluralize from '../../commons/utils/pluralize.js';
import "./BulkActionsPanel.css";

export default function BulkActionsPanel({ selectedIds, allIds, onClose, onSelectAll }) {
  const { refreshNotes } = useNotes();
  const count = selectedIds.length;
  const isAllSelected = selectedIds.length === allIds.length;

  function handleTrashClick() {
    openModal(
      <BulkDeleteModal
        count={count}
        onDeleteClick={handleTrashConfirmClick}
        onCloseClick={() => closeModal()}
      />
    );
  }

  function handleTrashConfirmClick() {
    ApiClient.bulkDeleteNotes(selectedIds)
      .then(() => {
        closeModal();
        showToast(`${count} ${pluralize(count, 'note')} moved to trash`);
        refreshNotes();
        onClose();
      })
      .catch(() => {
        showToast("Failed to move notes to trash");
      });
  }

  function handleArchiveClick() {
    ApiClient.bulkArchiveNotes(selectedIds)
      .then(() => {
        showToast(`${count} ${pluralize(count, 'note')} archived`);
        refreshNotes();
        onClose();
      })
      .catch(() => {
        showToast("Failed to archive notes");
      });
  }

  let selectAllRow = null;
  if (isAllSelected !== true) {
    selectAllRow = (
      <div className="bulk-actions-panel-row" onClick={onSelectAll}>
        <div className="bulk-actions-panel-row-icon">
          <FileCheckIcon />
        </div>
        <span className="bulk-actions-panel-row-label">Select Everything</span>
      </div>
    );
  }

  return (
    <div className="bulk-actions-panel">
      <div className="bulk-actions-panel-count">{count} {pluralize(count, 'note')} selected</div>

      {selectAllRow}

      <div className="bulk-actions-panel-row" onClick={handleArchiveClick}>
        <div className="bulk-actions-panel-row-icon">
          <ArchiveIcon />
        </div>
        <span className="bulk-actions-panel-row-label">Archive</span>
      </div>

      <div className="bulk-actions-panel-row" onClick={handleTrashClick}>
        <div className="bulk-actions-panel-row-icon">
          <TrashIcon />
        </div>
        <span className="bulk-actions-panel-row-label">Delete</span>
      </div>

      <div className="bulk-actions-panel-row cancel" onClick={onClose}>
        <div className="bulk-actions-panel-row-icon">
          <CloseIcon />
        </div>
        <span className="bulk-actions-panel-row-label">Cancel</span>
      </div>
    </div>
  );
}
