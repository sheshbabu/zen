import { h, render } from '../../assets/preact.esm.js';
import { CloseIcon } from './Icon.jsx';
import './Modal.css';

export function closeModal(selector = '.modal-root') {
  render(null, document.querySelector(selector));
}

export function openModal(component, selector = '.modal-root') {
  render(component, document.querySelector(selector));
}

export function ModalBackdrop({ children, onClose, isCentered = true }) {
  function handleBackdropClick(e) {
    if (e.target.classList.contains("modal-backdrop-container")) {
      onClose();
    }
  }

  const backdropClasses = `modal-backdrop-container ${isCentered ? 'is-centered' : ''}`;

  return (
    <div className={backdropClasses} onClick={handleBackdropClick}>
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
  return (
    <div className="modal-header">
      {title && <h3 className="modal-title">{title}</h3>}
      {children}
      {showCloseButton && onClose && (
        <CloseIcon className="modal-close-button" onClick={onClose} />
      )}
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