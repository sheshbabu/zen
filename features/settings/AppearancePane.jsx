import { h, useState, useEffect } from "../../assets/preact.esm.js";
import ThemePreferences from "../../commons/preferences/ThemePreferences.js";
import SettingsSection from "./SettingsSection.jsx";

const SIDEBAR_ROW_WIDTHS = [28, 22, 30, 18];
const NOTE_CARD_WIDTHS = [38, 30, 36, 26];
const EDITOR_LINES = [
  { y: 48, width: 100 },
  { y: 58, width: 84 },
  { y: 68, width: 94 },
  { y: 78, width: 60 },
  { y: 98, width: 96 },
  { y: 108, width: 72 },
  { y: 118, width: 88 },
  { y: 128, width: 50 }
];

const LIGHT_PREVIEW_COLORS = {
  background: "#FFFFFF",
  chrome: "#E5E5E5",
  sidebar: "#FAFAFA",
  selected: "#F4F4F5",
  border: "#D4D4D8",
  block: "#E5E5E5",
  blockStrong: "#D4D4D4"
};

const DARK_PREVIEW_COLORS = {
  background: "#0A0A0A",
  chrome: "#262626",
  sidebar: "#171717",
  selected: "#1F1F1F",
  border: "#404040",
  block: "#2E2E2E",
  blockStrong: "#404040"
};

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
  const [selectedThemeId, setSelectedThemeId] = useState(() => ThemePreferences.getPreference());

  useEffect(() => {
    ThemePreferences.setPreference(selectedThemeId);

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
      <SettingsSection title="Theme" description="Choose between light, dark, or system themes to match your preferences.">
        <div className="theme-selector">
          {themeOptions}
        </div>
      </SettingsSection>
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

function LightThemePreview() {
  return <ThemePreview colors={LIGHT_PREVIEW_COLORS} />;
}

function DarkThemePreview() {
  return <ThemePreview colors={DARK_PREVIEW_COLORS} />;
}

function ThemePreview({ colors }) {
  const sidebarRows = SIDEBAR_ROW_WIDTHS.map((width, index) => {
    const y = 42 + index * 12;
    return (
      <g key={index}>
        <circle cx="11" cy={y + 2} r="2.5" fill={colors.block} />
        <rect x="17" y={y} width={width} height="4" rx="2" fill={colors.block} />
      </g>
    );
  });

  const noteCards = NOTE_CARD_WIDTHS.map((width, index) => {
    const y = 24 + index * 30;

    let highlight = null;
    if (index === 0) {
      highlight = <rect x="60" y={y} width="52" height="24" rx="3" fill={colors.selected} />;
    }

    return (
      <g key={index}>
        {highlight}
        <rect x="65" y={y + 6} width={width} height="4" rx="2" fill={colors.blockStrong} />
        <rect x="65" y={y + 14} width={width - 10} height="3" rx="1.5" fill={colors.block} />
      </g>
    );
  });

  const editorLines = EDITOR_LINES.map(line => (
    <rect key={line.y} x="126" y={line.y} width={line.width} height="3" rx="1.5" fill={colors.block} />
  ));

  return (
    <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="239" height="159" rx="6" fill={colors.background} />
      <path d="M0.5 18V6.5a6 6 0 0 1 6-6h227a6 6 0 0 1 6 6V18Z" fill={colors.chrome} />
      <path d="M0.5 18H56V159.5H6.5a6 6 0 0 1-6-6Z" fill={colors.sidebar} />
      <circle cx="10" cy="9" r="3" fill="#EF4444" />
      <circle cx="20" cy="9" r="3" fill="#FBBF24" />
      <circle cx="30" cy="9" r="3" fill="#84CC16" />
      <path d="M0.5 18H239.5M56 18V159.5M116 18V159.5" stroke={colors.border} />
      <rect x="8" y="27" width="40" height="6" rx="2" fill={colors.blockStrong} />
      {sidebarRows}
      {noteCards}
      <rect x="126" y="28" width="64" height="8" rx="2" fill={colors.blockStrong} />
      {editorLines}
      <rect x="0.5" y="0.5" width="239" height="159" rx="6" stroke={colors.border} />
    </svg>
  );
}
