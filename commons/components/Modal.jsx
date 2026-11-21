import { h, render, Fragment, useEffect, useRef } from '../../assets/preact.esm.js';
import { CloseIcon } from './Icon.jsx';
import './Modal.css';

let modalStack = [];
let nextModalId = 1;

export function openModal(component) {
  modalStack = [...modalStack, { id: nextModalId++, component }];
  renderModals();
}

export function closeModal() {
  modalStack = modalStack.slice(0, -1);
  renderModals();
}

export function closeAllModals() {
  modalStack = [];
  renderModals();
}

export function isModalOpen() {
  return modalStack.length > 0;
}

function renderModals() {
  const modals = modalStack.map(modal => <Fragment key={modal.id}>{modal.component}</Fragment>);
  render(<>{modals}</>, document.querySelector('.modal-root'));
}

export function ModalBackdrop({ children, onClose, isCentered = true }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Escape' || e.defaultPrevented) {
        return;
      }
      // Only the top modal closes, so Escape on a stacked modal leaves the ones underneath open.
      const backdrops = document.querySelectorAll('.modal-backdrop-container');
      if (backdrops[backdrops.length - 1] === backdropRef.current) {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      onClose();
    }
  }

  const backdropClasses = `modal-backdrop-container ${isCentered ? 'is-centered' : ''}`;

  return (
    <div ref={backdropRef} className={backdropClasses} onClick={handleBackdropClick}>
      {children}
    </div>
  );
}

export function ModalContainer({ children, className = '' }) {
  const containerClasses = `modal-content-container ${className}`.trim();

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

export function ModalHeader({ title, onClose, showCloseButton = true, children }) {
  let titleElement = null;
  if (title) {
    titleElement = <h3 className="modal-title">{title}</h3>;
  }

  let closeButton = null;
  if (showCloseButton && onClose) {
    closeButton = <CloseIcon className="modal-close-button" onClick={onClose} />;
  }

  return (
    <div className="modal-header">
      {titleElement}
      {children}
      {closeButton}
    </div>
  );
}

export function ModalContent({ children, className = '' }) {
  const contentClasses = `modal-content ${className}`.trim();

  return (
    <div className={contentClasses}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, isRightAligned = false }) {
  const footerClasses = `modal-footer-container ${isRightAligned ? 'right-aligned' : ''}`.trim();

  return (
    <div className={footerClasses}>
      {children}
    </div>
  );
}