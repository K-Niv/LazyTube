import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  { keys: ['Space', 'R'], action: 'Roll the Dice' },
  { keys: ['T'], action: 'Toggle theme' },
  { keys: ['A'], action: 'Toggle Auto-Roll' },
  { keys: ['H'], action: 'Toggle history sidebar' },
  { keys: ['?'], action: 'Show / hide shortcuts' },
  { keys: ['Esc'], action: 'Close overlays' },
];

export default function ShortcutsModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="shortcuts-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shortcuts-modal__header">
              <h3 className="shortcuts-modal__title">⌨️ Keyboard Shortcuts</h3>
              <button className="shortcuts-modal__close" onClick={onClose}>✕</button>
            </div>
            <div className="shortcuts-modal__list">
              {SHORTCUTS.map((s) => (
                <div key={s.action} className="shortcuts-modal__item">
                  <div className="shortcuts-modal__keys">
                    {s.keys.map((k) => (
                      <kbd key={k} className="shortcuts-modal__kbd">{k}</kbd>
                    ))}
                  </div>
                  <span className="shortcuts-modal__action">{s.action}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
