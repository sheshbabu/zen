import { h } from '../../dependencies/preact.esm.js';

export default function NotesListToolbar({ onListViewClick, onGridViewClick }) {
  return (
    <div className="notes-list-toolbar">
      <div onClick={() => onListViewClick()}>
        <ListViewIcon />
      </div>
      <div onClick={() => onGridViewClick()}>
        <GridViewIcon />
      </div>
    </div>
  );
}

function ListViewIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-rows-3"
    >
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M21 9H3"/>
      <path d="M21 15H3"/>
    </svg>
  );
}

function GridViewIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-layout-grid"
    >
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  );
}