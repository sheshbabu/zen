import { h } from "../../assets/preact.esm.js"
import ApiClient from '../../commons/http/ApiClient.js';
import { CloseIcon, ArchiveIcon, UnarchiveIcon, RestoreIcon, TrashIcon } from '../../commons/components/Icon.jsx';
import { showToast } from '../../commons/components/Toast.jsx';
import { openModal, closeModal } from '../../commons/components/Modal.jsx';
import { useNotes } from '../../commons/contexts/NotesContext.jsx';
import useSearchParams from '../../commons/components/useSearchParams.jsx';
import BulkDeleteModal from './BulkDeleteModal.jsx';
import pluralize from '../../commons/utils/pluralize.js';
import "./BulkActionsToolbar.css";

export default function BulkActionsToolbar({ selectedIds, allIds, onClose, onSelectAll }) {
  const { handleNoteChange } = useNotes();
  const searchParams = useSearchParams();
  const isTrashPage = searchParams.get("isDeleted") === "true";
  const isArchivePage = searchParams.get("isArchived") === "true";
  const count = selectedIds.length;
  const isAllSelected = selectedIds.length === allIds.length;

  let selectAllButton = null;
  if (isAllSelected !== true) {
    selectAllButton = <div className="bulk-actions-toolbar-select-all" onClick={onSelectAll}>Select All</div>;
  }

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

  // Trashed notes can only be restored or purged, never archived.
  let archiveOrRestoreClick = handleArchiveClick;
  let archiveOrRestoreIcon = <ArchiveIcon />;
  let trashClick = handleTrashClick;
  if (isArchivePage) {
    archiveOrRestoreClick = handleUnarchiveClick;
    archiveOrRestoreIcon = <UnarchiveIcon />;
  }
  if (isTrashPage) {
    archiveOrRestoreClick = handleRestoreClick;
    archiveOrRestoreIcon = <RestoreIcon />;
    trashClick = handleForceDeleteClick;
  }

  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-actions-toolbar-left">
        <div className="bulk-actions-toolbar-close" onClick={onClose}>
          <CloseIcon />
        </div>
        <span className="bulk-actions-toolbar-count">{count} {pluralize(count, 'note')} selected</span>
        {selectAllButton}
      </div>
      <div className="bulk-actions-toolbar-right">
        <div className="bulk-actions-toolbar-icon" onClick={archiveOrRestoreClick}>
          {archiveOrRestoreIcon}
        </div>
        <div className="bulk-actions-toolbar-icon" onClick={trashClick}>
          <TrashIcon />
        </div>
      </div>
    </div>
  );
}
