import { h } from '../../assets/preact.esm.js';
import { ModalBackdrop, ModalContainer } from './Modal.jsx';
import './BottomDrawer.css';

export default function BottomDrawer({ children, onClose, className = '' }) {
  const containerClasses = `bottom-drawer ${className}`.trim();

  return (
    <ModalBackdrop onClose={onClose} isCentered={true}>
      <ModalContainer className={containerClasses}>
        {children}
      </ModalContainer>
    </ModalBackdrop>
  );
}
