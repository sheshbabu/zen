import { h } from '../../assets/preact.esm.js';
import './Button.css';

export default function Button({ children, variant = '', type = 'button', isDisabled = false, onClick, className = '', ...props }) {
  const buttonClasses = ["button", variant, className].join(" ");

  // The non-submit variants render a div, which ignores the disabled attribute.
  function handleClick(e) {
    if (isDisabled) {
      return;
    }
    if (onClick) {
      onClick(e);
    }
  }

  if (variant === 'ghost') {
    return (
      <div className={`ghost-button ${className}`} onClick={handleClick} disabled={isDisabled} {...props}>
        {children}
      </div>
    );
  }
  
  if (type === 'submit') {
    return (
      <button type={type} className={buttonClasses} disabled={isDisabled} onClick={onClick} {...props}>
        {children}
      </button>
    );
  }

  return (
    <div className={buttonClasses} disabled={isDisabled} onClick={handleClick} {...props}>
      {children}
    </div>
  );
}