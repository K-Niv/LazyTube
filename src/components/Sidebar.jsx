import React from 'react';

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Sidebar({ history, onSelect, onClear }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">History</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {history.length > 0 && (
            <>
              <span className="sidebar__count">{history.length}</span>
              <button className="clear-btn" onClick={onClear}>
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="sidebar__list">
        {history.length === 0 ? (
          <div className="sidebar__empty">
            <div className="sidebar__empty-icon">📋</div>
            <p className="sidebar__empty-text">
              Videos you watch will appear here so you can revisit them later.
            </p>
          </div>
        ) : (
          history.map((item, index) => (
            <div
              key={`${item.videoId}-${index}`}
              className="history-item"
              onClick={() => onSelect(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
            >
              <img
                className={`history-item__thumb ${item.isShort ? 'history-item__thumb--shorts' : ''}`}
                src={item.thumbnail}
                alt=""
                loading="lazy"
              />
              <div className="history-item__info">
                <span className="history-item__title">{item.title}</span>
                <span className="history-item__time">
                  {item.isShort && '⚡ Short · '}
                  {timeAgo(item.watchedAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
