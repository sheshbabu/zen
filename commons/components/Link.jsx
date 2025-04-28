import { h } from '../../assets/preact.esm.js';
import navigateTo from '../utils/navigateTo.js';

export default function Link({ to, shouldPreserveSearchParams, children, className = "", activeClassName = "" }) {
  function handleClick(event) {
    event.stopPropagation();
    event.preventDefault();
    navigateTo(to, shouldPreserveSearchParams);
  }

  const currentPath = window.location.pathname;
  const currentSearchParams = new URLSearchParams(window.location.search);

  const linkPath = new URL(to, window.location.origin).pathname;
  const linkSearchParams = new URLSearchParams(new URL(to, window.location.origin).search);

  const isSamePath = currentPath === linkPath;
  const hasSomeCommonSearchParams = Array.from(linkSearchParams.entries()).some(([key, value]) => currentSearchParams.get(key) === value);
  const isEmptySearchParams = Array.from(linkSearchParams.entries()).length === 0 && Array.from(currentSearchParams.entries()).length === 0;

  let finalClassName = className;
  if (
    // Example: "/notes/new" and "/notes/new"
    (isSamePath && isEmptySearchParams) ||

    // Example: "/notes/?tagId=1" and "/notes/?tagId=1&focusId=2"
    (isSamePath && hasSomeCommonSearchParams) ||

    // Example: "/notes/29" and "/notes/29?tagId=1"
    (isSamePath && shouldPreserveSearchParams && Array.from(linkSearchParams.entries()).length === 0) ||
    
    // Example: "/notes/?tagId=1" and "/notes/29?tagId=1&focusId=2"
    (shouldPreserveSearchParams && hasSomeCommonSearchParams)
  ) {
    finalClassName += " " + activeClassName;
  }

  return (
    <a href={to} onClick={handleClick} className={finalClassName}>
      {children}
    </a>
  );
};
