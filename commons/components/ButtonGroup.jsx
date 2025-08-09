import { h } from '../../assets/preact.esm.js';
import './ButtonGroup.css';

export default function ButtonGroup({ children, className = '', isMobile = false }) {
  const groupClasses = `button-group ${isMobile ? 'is-mobile' : ''} ${className}`.trim();

  return (
    <div className={groupClasses}>
      {children}
    </div>
  );
}