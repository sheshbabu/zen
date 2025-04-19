import { h } from '../../dependencies/preact.esm.js';
import navigateTo from '../utils/navigateTo.js';

export default function Link({ to, children, className }) {
  const handleClick = (event) => {
    event.preventDefault();
    navigateTo(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
