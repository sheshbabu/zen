import { h, Fragment } from "../../assets/preact.esm.js"
import { CloseIcon, ArchiveIcon, UnarchiveIcon, RestoreIcon, TrashIcon, FileCheckIcon } from '../../commons/components/Icon.jsx';
import ApiClient from '../../commons/http/ApiClient.js';
import { showToast } from '../../commons/components/Toast.jsx';
import { openModal, closeModal } from '../../commons/components/Modal.jsx';
import { useNotes } from '../../commons/contexts/NotesContext.jsx';
import useSearchParams from '../../commons/components/useSearchParams.jsx';
import BulkDeleteModal from './BulkDeleteModal.jsx';
import pluralize from '../../commons/utils/pluralize.js';
import "./BulkActionsPanel.css";

export default function BulkActionsPanel({ selectedIds, allIds, onClose, onSelectAll }) {
  const { handleNoteChange } = useNotes();
  const searchParams = useSearchParams();
  const isTrashPage = searchParams.get("isDeleted") === "true";
  const isArchivePage = searchParams.get("isArchived") === "true";
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
        handleNoteChange();
        onClose();
      })
      .catch(() => {
        showToast("Failed to move notes to trash");
      });
  }

  function handleForceDeleteClick() {
    openModal(
      <BulkDeleteModal
        count={count}
        isPermanent
        onDeleteClick={handleForceDeleteConfirmClick}
        onCloseClick={() => closeModal()}
      />
    );
  }

  function handleForceDeleteConfirmClick() {
    ApiClient.bulkForceDeleteNotes(selectedIds)
      .then(() => {
        closeModal();
        showToast(`${count} ${pluralize(count, 'note')} permanently deleted`);
        handleNoteChange();
        onClose();
      })
      .catch(() => {
        showToast("Failed to delete notes");
      });
  }

  function handleRestoreClick() {
    ApiClient.bulkRestoreNotes(selectedIds)
      .then(() => {
        showToast(`${count} ${pluralize(count, 'note')} restored`);
        handleNoteChange();
        onClose();
      })
      .catch(() => {
        showToast("Failed to restore notes");
      });
  }

  function handleArchiveClick() {
    ApiClient.bulkArchiveNotes(selectedIds)
      .then(() => {
        showToast(`${count} ${pluralize(count, 'note')} archived`);
        handleNoteChange();
        onClose();
      })
      .catch(() => {
        showToast("Failed to archive notes");
      });
  }

  function handleUnarchiveClick() {
    ApiClient.bulkUnarchiveNotes(selectedIds)
      .then(() => {
        showToast(`${count} ${pluralize(count, 'note')} unarchived`);
        handleNoteChange();
        onClose();
      })
      .catch(() => {
        showToast("Failed to unarchive notes");
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

  let archiveClick = handleArchiveClick;
  let archiveLabel = "Archive";
  let archiveIcon = <ArchiveIcon />;
  if (isArchivePage) {
    archiveClick = handleUnarchiveClick;
    archiveLabel = "Unarchive";
    archiveIcon = <UnarchiveIcon />;
  }

  // Trashed notes can only be restored or purged, never archived.
  let actionRows = (
    <>
      <div className="bulk-actions-panel-row" onClick={archiveClick}>
        <div className="bulk-actions-panel-row-icon">
          {archiveIcon}
        </div>
        <span className="bulk-actions-panel-row-label">{archiveLabel}</span>
      </div>

      <div className="bulk-actions-panel-row" onClick={handleTrashClick}>
        <div className="bulk-actions-panel-row-icon">
          <TrashIcon />
        </div>
        <span className="bulk-actions-panel-row-label">Delete</span>
      </div>
    </>
  );
  if (isTrashPage) {
    actionRows = (
      <>
        <div className="bulk-actions-panel-row" onClick={handleRestoreClick}>
          <div className="bulk-actions-panel-row-icon">
            <RestoreIcon />
          </div>
          <span className="bulk-actions-panel-row-label">Restore</span>
        </div>

        <div className="bulk-actions-panel-row" onClick={handleForceDeleteClick}>
          <div className="bulk-actions-panel-row-icon">
            <TrashIcon />
          </div>
          <span className="bulk-actions-panel-row-label">Delete Forever</span>
        </div>
      </>
    );
  }

  return (
    <div className="bulk-actions-panel">
      <div className="bulk-actions-panel-count">{count} {pluralize(count, 'note')} selected</div>

      {selectAllRow}

      {actionRows}

      <div className="bulk-actions-panel-row cancel" onClick={onClose}>
        <div className="bulk-actions-panel-row-icon">
          <CloseIcon />
        </div>
        <span className="bulk-actions-panel-row-label">Cancel</span>
      </div>
    </div>
  );
}
