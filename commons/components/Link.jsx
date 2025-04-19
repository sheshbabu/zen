import { h } from '../../assets/preact.esm.js';
import navigateTo from '../utils/navigateTo.js';

export default function Link({ to, shouldPreserveSearchParams, children, className }) {
  const handleClick = (event) => {
    event.preventDefault();
    navigateTo(to, shouldPreserveSearchParams);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
