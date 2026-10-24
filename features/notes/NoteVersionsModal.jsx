import { h, useState, useEffect } from "../../assets/preact.esm.js";
import { ModalBackdrop, ModalContainer } from "../../commons/components/Modal.jsx";
import { CloseIcon, HistoryIcon } from "../../commons/components/Icon.jsx";
import Button from "../../commons/components/Button.jsx";
import Spinner from "../../commons/components/Spinner.jsx";
import EmptyState from "../../commons/components/EmptyState.jsx";
import ApiClient from "../../commons/http/ApiClient.js";
import renderMarkdown from "../../commons/utils/renderMarkdown.js";
import "./NoteVersionsModal.css";

const CURRENT_VERSION_ID = -1;

export default function NoteVersionsModal({ note, onRestoreClick, onCloseClick }) {
  const [versions, setVersions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState(CURRENT_VERSION_ID);

  useEffect(() => {
    setIsLoading(true);

    ApiClient.getNoteVersions(note.noteId, pageNumber)
      .then(res => {
        if (pageNumber > 1) {
          setVersions(prevVersions => [...prevVersions, ...res.versions]);
        } else {
          setVersions(res.versions);
        }
        setTotal(res.total);
      })
      .catch(() => {
        setVersions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [note.noteId, pageNumber]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseClick();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCloseClick]);

  function handleLoadMoreClick() {
    setPageNumber(prevPageNumber => prevPageNumber + 1);
  }

  function handleRestoreClick() {
    setIsRestoreLoading(true);
    onRestoreClick(selectedVersionId).finally(() => {
      setIsRestoreLoading(false);
    });
  }

  const isCurrentSelected = selectedVersionId === CURRENT_VERSION_ID;

  let selectedTitle = note.title;
  let selectedContent = note.content;

  if (isCurrentSelected !== true) {
    const selectedVersion = versions.find(version => version.versionId === selectedVersionId);
    if (selectedVersion !== undefined) {
      selectedTitle = selectedVersion.title;
      selectedContent = selectedVersion.content;
    }
  }

  const versionRows = versions.map(version => {
    const isSelected = version.versionId === selectedVersionId;
    const rowClasses = isSelected ? "note-versions-row is-selected" : "note-versions-row";

    return (
      <div key={version.versionId} className={rowClasses} onClick={() => setSelectedVersionId(version.versionId)}>
        <div className="note-versions-row-timestamp">{formatVersionDate(version.createdAt)}</div>
      </div>
    );
  });

  let railContent = null;
  if (isLoading === true && versions.length === 0) {
    railContent = <div className="note-versions-spinner"><Spinner /></div>;
  } else if (versions.length === 0) {
    railContent = <EmptyState icon={<HistoryIcon />} title="No versions" description="Edits to this note will show up here" />;
  } else {
    railContent = versionRows;
  }

  let loadMoreButton = null;
  if (versions.length > 0 && versions.length !== total) {
    if (isLoading === true) {
      loadMoreButton = <div className="note-versions-spinner"><Spinner /></div>;
    } else {
      loadMoreButton = <Button className="note-versions-load-more-button" onClick={handleLoadMoreClick}>Load more</Button>;
    }
  }

  const restoreButtonText = isRestoreLoading ? "Restoring..." : "Restore";

  const currentRowClasses = isCurrentSelected ? "note-versions-row is-selected" : "note-versions-row";
  const titleText = selectedTitle !== "" ? selectedTitle : "Untitled";

  return (
    <ModalBackdrop onClose={onCloseClick} isCentered>
      <ModalContainer className="note-versions-modal">
        <div className="note-versions-rail">
          <div className="note-versions-rail-header">Version history</div>
          <div className="note-versions-rail-list">
            <div className={currentRowClasses} onClick={() => setSelectedVersionId(CURRENT_VERSION_ID)}>
              <div className="note-versions-row-timestamp">{formatVersionDate(note.updatedAt)}</div>
              <div className="note-versions-row-label">Current version</div>
            </div>
            {railContent}
            {loadMoreButton}
          </div>
          <NoteVersionTiers />
        </div>
        <div className="note-versions-preview">
          <div className="note-versions-preview-header">
            <Button variant="danger" isDisabled={isCurrentSelected === true || isRestoreLoading === true} onClick={handleRestoreClick}>{restoreButtonText}</Button>
            <CloseIcon className="note-versions-close-button" onClick={onCloseClick} />
          </div>
          <div className="note-versions-preview-content">
            <div className="notes-editor-title">{titleText}</div>
            <div className="notes-editor-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedContent) }} />
          </div>
        </div>
      </ModalContainer>
    </ModalBackdrop>
  );
}

function NoteVersionTiers() {
  const tiers = [
    { age: "Last hour", kept: "Every edit" },
    { age: "Up to 7 days", kept: "Hourly" },
    { age: "Up to 30 days", kept: "Daily" },
    { age: "Older", kept: "Weekly" },
  ];

  const tierRows = tiers.map(tier => (
    <div key={tier.age} className="note-versions-tiers-row">
      <span className="note-versions-tiers-age">{tier.age}</span>
      <span className="note-versions-tiers-kept">{tier.kept}</span>
    </div>
  ));

  return (
    <div className="note-versions-tiers">
      <div className="note-versions-tiers-header">What's kept and for how long:</div>
      {tierRows}
    </div>
  );
}

function formatVersionDate(dateString) {
  if (typeof dateString !== 'string' || dateString === "") {
    return "";
  }
  return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
