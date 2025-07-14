import { h, render, useState, useEffect } from "../../assets/preact.esm.js"
import { CloseIcon } from "./Icon.jsx";
import "./Toast.css";

function Toast({ message, duration = 3000 }) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  function handleDismiss() {
    setIsOpen(false);
    setTimeout(() => {
      render(null, document.querySelector('.toast-root'));
    }, 100);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="toast-container">
      <div className="toast-message">
        {message}
      </div>
      <div className="toast-close" onClick={handleDismiss}>
        <CloseIcon />
      </div>
    </div>
  );
}

export function showToast(message, duration = 3000) {
  render(
    <Toast message={message} duration={duration} />,
    document.querySelector('.toast-root')
  );
}
