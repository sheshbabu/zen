import { h } from '../../dependencies/preact.esm.js';

export default function Link({ to, children, className }) {
  const handleClick = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("navigate"));
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
