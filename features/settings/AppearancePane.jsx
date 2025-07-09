import { h, useState, useEffect } from "../../assets/preact.esm.js";

const themes = [
  {
    id: 'system',
    name: 'Auto',
    preview: <SystemThemePreview />
  },
  {
    id: 'dark',
    name: 'Dark',
    preview: <DarkThemePreview />
  },
  {
    id: 'light',
    name: 'Light',
    preview: <LightThemePreview />
  }
];

export default function AppearancePane() {
  const [selectedThemeId, setSelectedThemeId] = useState("system");

  useEffect(() => {
    const savedThemeId = localStorage.getItem('theme-preference') || 'system';
    setSelectedThemeId(savedThemeId);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme-preference', selectedThemeId);

    if (selectedThemeId === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', selectedThemeId);
    }
  }, [selectedThemeId]);

  function handleThemeSelect(themeId) {
    setSelectedThemeId(themeId);
  }

  const themeOptions = themes.map(theme => {
    const isSelected = selectedThemeId === theme.id;
    return (
      <div className={`theme-option ${isSelected ? 'is-selected' : ''}`} onClick={() => handleThemeSelect(theme.id)}>
        <div className="theme-preview">
          {theme.preview}
        </div>
        <div className="theme-info">
          <div className="theme-name">{theme.name}</div>
        </div>
      </div>
    );
  });

  return (
    <div className="settings-tab-content">
      <h3>Appearance</h3>
      <p>Choose between light, dark, or system themes to match your preferences.</p>
      <div className="theme-selector">
        {themeOptions}
      </div>
    </div>
  ); 
}

function SystemThemePreview() {
  return (
    <div className="system-theme-preview">
      <div className="system-theme-half">
        <LightThemePreview />
      </div>
      <div className="system-theme-half">
        <DarkThemePreview />
      </div>
    </div>
  );
}

function DarkThemePreview() {
  return (
    <svg width="456" height="316" viewBox="0 0 456 316" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="454" height="314" rx="7" fill="black" stroke="#525252" strokeWidth="2" />
      <path d="M8 1H92C95.866 1 99 4.13401 99 8V315H8C4.13401 315 1 311.866 1 308V8C1 4.25486 3.94112 1.19633 7.63965 1.00879L8 1Z" fill="#171717" stroke="#525252" strokeWidth="2" />
      <path d="M100 1H191C194.866 1 198 4.13401 198 8V315H93V8C93 4.25486 95.9411 1.19633 99.6396 1.00879L100 1Z" fill="black" stroke="#525252" strokeWidth="2" />
      <path d="M8 1H448C451.866 1 455 4.13401 455 8V31H1V8C1 4.25486 3.94111 1.19633 7.63965 1.00879L8 1Z" fill="#404040" stroke="#525252" strokeWidth="2" />
      <circle cx="16" cy="16" r="6" fill="#EF4444" />
      <circle cx="36" cy="16" r="6" fill="#FBBF24" />
      <circle cx="56" cy="16" r="6" fill="#84CC16" />
      <rect x="107" y="39" width="70" height="8" rx="2" fill="#404040" />
      <rect x="10" y="39" width="75" height="12" rx="2" fill="#404040" />
      <rect x="10" y="63" width="63" height="8" rx="2" fill="#404040" />
      <rect x="10" y="81" width="63" height="8" rx="2" fill="#404040" />
      <rect x="10" y="99" width="63" height="8" rx="2" fill="#404040" />
      <rect x="10" y="117" width="63" height="8" rx="2" fill="#404040" />
      <rect x="10" y="135" width="63" height="8" rx="2" fill="#404040" />
      <rect x="211" y="39" width="100" height="16" rx="2" fill="#404040" />
      <rect x="107" y="125" width="70" height="8" rx="2" fill="#404040" />
      <rect x="107" y="212" width="70" height="8" rx="2" fill="#404040" />
      <rect x="107" y="82" width="70" height="8" rx="2" fill="#404040" />
      <rect x="211" y="71" width="226" height="6" rx="2" fill="#404040" />
      <rect x="211" y="93" width="154" height="6" rx="2" fill="#404040" />
      <rect x="211" y="115" width="189" height="6" rx="2" fill="#404040" />
      <rect x="211" y="247" width="189" height="6" rx="2" fill="#404040" />
      <rect x="211" y="137" width="89" height="6" rx="2" fill="#404040" />
      <rect x="211" y="269" width="89" height="6" rx="2" fill="#404040" />
      <rect x="211" y="159" width="117" height="6" rx="2" fill="#404040" />
      <rect x="211" y="181" width="70" height="6" rx="2" fill="#404040" />
      <rect x="211" y="203" width="154" height="6" rx="2" fill="#404040" />
      <rect x="211" y="225" width="117" height="6" rx="2" fill="#404040" />
      <rect x="107" y="168" width="70" height="8" rx="2" fill="#404040" />
      <rect x="107" y="255" width="70" height="8" rx="2" fill="#404040" />
      <rect x="107" y="57" width="50" height="6" rx="2" fill="#404040" />
      <rect x="107" y="143" width="50" height="6" rx="2" fill="#404040" />
      <rect x="107" y="229" width="50" height="6" rx="2" fill="#404040" />
      <rect x="107" y="100" width="50" height="6" rx="2" fill="#404040" />
      <rect x="107" y="186" width="50" height="6" rx="2" fill="#404040" />
      <rect x="107" y="272" width="50" height="6" rx="2" fill="#404040" />
    </svg>

  );
}

function LightThemePreview() {
  return (
    <svg width="456" height="316" viewBox="0 0 456 316" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="454" height="314" rx="7" fill="white" stroke="#D4D4D8" strokeWidth="2" />
      <path d="M8 1H92C95.866 1 99 4.13401 99 8V315H8C4.13401 315 1 311.866 1 308V8C1 4.25486 3.94112 1.19633 7.63965 1.00879L8 1Z" fill="#FAFAFA" stroke="#D4D4D8" strokeWidth="2" />
      <path d="M100 1H191C194.866 1 198 4.13401 198 8V315H93V8C93 4.25486 95.9411 1.19633 99.6396 1.00879L100 1Z" fill="white" stroke="#D4D4D8" strokeWidth="2" />
      <path d="M8 1H448C451.866 1 455 4.13401 455 8V31H1V8C1 4.25486 3.94111 1.19633 7.63965 1.00879L8 1Z" fill="#E5E5E5" stroke="#D4D4D8" strokeWidth="2" />
      <circle cx="16" cy="16" r="6" fill="#EF4444" />
      <circle cx="36" cy="16" r="6" fill="#FBBF24" />
      <circle cx="56" cy="16" r="6" fill="#84CC16" />
      <rect x="107" y="39" width="70" height="8" rx="2" fill="#E5E5E5" />
      <rect x="10" y="39" width="75" height="12" rx="2" fill="#E5E5E5" />
      <rect x="10" y="63" width="63" height="8" rx="2" fill="#E5E5E5" />
      <rect x="10" y="81" width="63" height="8" rx="2" fill="#E5E5E5" />
      <rect x="10" y="99" width="63" height="8" rx="2" fill="#E5E5E5" />
      <rect x="10" y="117" width="63" height="8" rx="2" fill="#E5E5E5" />
      <rect x="10" y="135" width="63" height="8" rx="2" fill="#E5E5E5" />
      <rect x="211" y="39" width="100" height="16" rx="2" fill="#E5E5E5" />
      <rect x="107" y="125" width="70" height="8" rx="2" fill="#E5E5E5" />
      <rect x="107" y="212" width="70" height="8" rx="2" fill="#E5E5E5" />
      <rect x="107" y="82" width="70" height="8" rx="2" fill="#E5E5E5" />
      <rect x="211" y="71" width="226" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="93" width="154" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="115" width="189" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="247" width="189" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="137" width="89" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="269" width="89" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="159" width="117" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="181" width="70" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="203" width="154" height="6" rx="2" fill="#E5E5E5" />
      <rect x="211" y="225" width="117" height="6" rx="2" fill="#E5E5E5" />
      <rect x="107" y="168" width="70" height="8" rx="2" fill="#E5E5E5" />
      <rect x="107" y="255" width="70" height="8" rx="2" fill="#E5E5E5" />
      <rect x="107" y="57" width="50" height="6" rx="2" fill="#E5E5E5" />
      <rect x="107" y="143" width="50" height="6" rx="2" fill="#E5E5E5" />
      <rect x="107" y="229" width="50" height="6" rx="2" fill="#E5E5E5" />
      <rect x="107" y="100" width="50" height="6" rx="2" fill="#E5E5E5" />
      <rect x="107" y="186" width="50" height="6" rx="2" fill="#E5E5E5" />
      <rect x="107" y="272" width="50" height="6" rx="2" fill="#E5E5E5" />
    </svg>
  );
}