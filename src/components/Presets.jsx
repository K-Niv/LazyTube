import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const pill = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export default function Presets({ presets, onPreset, onAdd, onRemove, isLoading, activePreset }) {
  const scrollRef = useRef(null);

  const scroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      className="presets"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <div className="presets__header">
        <span className="presets__label">Your Presets</span>
        <div className="presets__controls">
          <button className="presets__arrow" onClick={() => scroll(-200)} aria-label="Scroll left">
            &lt;
          </button>
          <button className="presets__arrow" onClick={() => scroll(200)} aria-label="Scroll right">
            &gt;
          </button>
        </div>
      </div>

      <div className="presets__list-wrapper">
        <div className="presets__list" ref={scrollRef}>
          <motion.button
            className="presets__pill presets__pill--add"
            variants={pill}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onAdd}
            disabled={isLoading}
          >
            <span className="presets__emoji">➕</span> New
          </motion.button>

          <AnimatePresence>
            {presets.length === 0 ? (
              <motion.div
                className="presets__empty-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                👉 Create your first preset to quickly jump back to your favorite filters!
              </motion.div>
            ) : (
              presets.map((p) => (
                <motion.div
                  key={p.id}
                  className={`presets__pill-wrapper ${activePreset === p.name ? 'presets__pill-wrapper--active' : ''}`}
                  variants={pill}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <button
                    className={`presets__pill ${activePreset === p.name ? 'presets__pill--active' : ''}`}
                    onClick={() => onPreset(p)}
                    disabled={isLoading}
                  >
                    <span className="presets__emoji">{p.emoji}</span>
                    {p.name}
                  </button>
                  <button 
                    className="presets__pill-delete"
                    onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
                    aria-label="Delete preset"
                  >
                    ✕
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
