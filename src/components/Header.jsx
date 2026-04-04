import React from 'react';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">▶</div>
        <h1 className="header__title">Lazy<span>Tube</span></h1>
      </div>

      <div className="header__actions">
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
