import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}

export default function Sidebar({ history, onSelect, onClear, isOpen, onClose }) {
  const isMobile = useIsMobile();

  function handleSelect(item) {
    onSelect(item);
    onClose();
  }

  // Desktop: slide from right. Mobile: slide from bottom.
  const slideVariants = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.aside
            className="sidebar"
            initial={slideVariants.initial}
            animate={slideVariants.animate}
            exit={slideVariants.exit}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
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
                <button className="sidebar__close" onClick={onClose} aria-label="Close history">
                  ✕
                </button>
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
                <AnimatePresence>
                  {history.map((item, index) => (
                    <motion.div
                      key={`${item.videoId}-${index}`}
                      className="history-item"
                      onClick={() => handleSelect(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelect(item)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, delay: index < 5 ? index * 0.04 : 0 }}
                      whileHover={{ backgroundColor: 'var(--bg-glass-hover)' }}
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
