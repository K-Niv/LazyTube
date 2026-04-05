import React from 'react';

export default function Header({
  theme,
  onToggleTheme,
  onShowShortcuts,
  autoRoll,
  onAutoRollToggle,
  onToggleSidebar,
  sidebarOpen,
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

        {/* History toggle */}
        <button
          className={`history-toggle ${sidebarOpen ? 'history-toggle--active' : ''}`}
          onClick={onToggleSidebar}
          title="Toggle history"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

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
