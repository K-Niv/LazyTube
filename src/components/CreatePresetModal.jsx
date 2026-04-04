import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = [
  '🎵', '😂', '🧠', '🎲', '🎮', '💻', '🎬', '🎧', '🎸', '⚽',
  '🍳', '🔥', '✨', '⚡', '🌟', '🌙', '🌊', '🚀', '🔮', '🧘‍♀️'
];

export default function CreatePresetModal({ isOpen, onClose, onSave, currentFilters }) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');

  // Helper to format filter text nicely
  const formatFilters = () => {
    let parts = [];
    if (currentFilters.query) parts.push(`"${currentFilters.query}"`);
    parts.push(currentFilters.contentType === 'shorts' ? 'Shorts' : 'Videos');
    if (currentFilters.duration) parts.push(currentFilters.duration);
    return parts.join(' • ');
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      emoji: selectedEmoji,
      ...currentFilters
    });
    setName('');
    setSelectedEmoji('✨');
    onClose();
  };

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
            className="shortcuts-modal preset-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shortcuts-modal__header">
              <h3 className="shortcuts-modal__title">Create Preset</h3>
              <button className="shortcuts-modal__close" onClick={onClose}>✕</button>
            </div>
            
            <div className="preset-modal__body">
              <div className="preset-modal__section">
                <label className="preset-modal__label">Preset Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. My Chill Mix"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  maxLength={25}
                />
              </div>

              <div className="preset-modal__section">
                <label className="preset-modal__label">Choose an Emoji</label>
                <div className="preset-modal__emojis">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className={`preset-modal__emoji-btn ${selectedEmoji === emoji ? 'preset-modal__emoji-btn--active' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="preset-modal__summary">
                <span className="preset-modal__summary-label">Saves current filters:</span>
                <span className="preset-modal__summary-text">{formatFilters()}</span>
              </div>

              <button 
                className="preset-modal__save-btn random-btn" 
                onClick={handleSave}
                disabled={!name.trim()}
              >
                Save Preset
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
