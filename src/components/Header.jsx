import React from 'react';

export default function Header({
  theme,
  onToggleTheme,
  onShowShortcuts,
  autoRoll,
  onAutoRollToggle,
  autoRollInterval,
  onAutoRollIntervalChange,
  autoRollOptions,
}) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">▶</div>
        <h1 className="header__title">Lazy<span>Tube</span></h1>
      </div>

      <div className="header__actions">
        {/* Auto-Roll toggle */}
        <div className="autoroll-toggle">
          <button
            className={`autoroll-toggle__btn ${autoRoll ? 'autoroll-toggle__btn--active' : ''}`}
            onClick={onAutoRollToggle}
            title={autoRoll ? 'Disable Auto-Roll' : 'Enable Auto-Roll (TV Mode)'}
          >
            {autoRoll ? '📺' : '📺'}
            <span className="autoroll-toggle__text">
              {autoRoll ? 'ON' : 'TV'}
            </span>
          </button>
        </div>

        {/* Shortcuts button */}
        <button
          className="shortcuts-btn"
          onClick={onShowShortcuts}
          title="Keyboard shortcuts"
        >
          ?
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle__knob">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>
      </div>
    </header>
  );
}
