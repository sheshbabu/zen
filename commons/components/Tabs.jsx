import { h } from '../../assets/preact.esm.js';
import './Tabs.css';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  const items = tabs.map(tab => {
    const isActive = tab.value === activeTab;
    return (
      <button
        key={tab.value}
        className={`tab ${isActive ? "is-active" : ""}`}
        onClick={() => onTabChange(tab.value)}
      >
        {tab.label}
      </button>
    );
  });

  return (
    <div className="tabs">
      {items}
    </div>
  );
}
