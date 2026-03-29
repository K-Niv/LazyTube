import React from 'react';

export default function Header({ theme, onToggleTheme, quota }) {
  const quotaPercent = quota.limit > 0 ? ((quota.limit - quota.used) / quota.limit) * 100 : 100;
  const dotClass =
    quotaPercent > 50 ? '' : quotaPercent > 20 ? 'quota-badge__dot--warning' : 'quota-badge__dot--danger';

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">▶</div>
        <h1 className="header__title">LazyTube</h1>
      </div>

      <div className="header__actions">
        <div className="quota-badge">
          <span className={`quota-badge__dot ${dotClass}`} />
          <span>{quota.limit - quota.used} / {quota.limit} quota left</span>
        </div>

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
