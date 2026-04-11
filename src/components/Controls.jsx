import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchChannels } from '../services/api';

const REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
];

const DURATIONS = [
  { value: '', label: 'Any Length' },
  { value: 'short', label: 'Short (< 4 min)' },
  { value: 'medium', label: 'Medium (4–20 min)' },
  { value: 'long', label: 'Long (> 20 min)' },
];

function formatSubscribers(count) {
  if (!count) return '';
  const num = parseInt(count, 10);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M subs';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K subs';
  return num + ' subs';
}

// Local cache of channel name -> results so repeat lookups are free
const channelLookupCache = new Map();

const row = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function Controls({
  region,
  onRegionChange,
  categories,
  selectedCategory,
  onCategoryChange,
  contentType,
  onContentTypeChange,
  duration,
  onDurationChange,
  query,
  onQueryChange,
  selectedChannel,
  onChannelChange,
  onRandom,
  isLoading,
  categoriesLoading,
}) {
  const [channelQuery, setChannelQuery] = useState('');
  const [channelResults, setChannelResults] = useState([]);
  const [channelSearching, setChannelSearching] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowChannelDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleChannelSearch() {
    const q = channelQuery.trim();
    if (!q) return;

    // Check local cache first
    if (channelLookupCache.has(q.toLowerCase())) {
      setChannelResults(channelLookupCache.get(q.toLowerCase()));
      setShowChannelDropdown(true);
      return;
    }

    setChannelSearching(true);
    try {
      const results = await searchChannels(q);
      channelLookupCache.set(q.toLowerCase(), results);
      setChannelResults(results);
      setShowChannelDropdown(true);
    } catch (err) {
      console.error('Channel search failed:', err);
    } finally {
      setChannelSearching(false);
    }
  }

  function handleSelectChannel(channel) {
    onChannelChange(channel);
    setChannelQuery('');
    setShowChannelDropdown(false);
  }

  function handleClearChannel() {
    onChannelChange(null);
    setChannelQuery('');
  }

  return (
    <motion.div
      className="controls"
      variants={row}
      initial="hidden"
      animate="visible"
    >
      {/* Search Query */}
      <motion.div className="controls__row" variants={item}>
        <div className="controls__group">
          <label className="controls__label" htmlFor="query-input">Search Query (Optional)</label>
          <input
            id="query-input"
            type="text"
            className="input"
            placeholder="E.g., funny cats, lo-fi beats, unboxing..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) onRandom();
            }}
          />
        </div>
      </motion.div>

      {/* Channel Filter */}
      <motion.div className="controls__row" variants={item}>
        <div className="controls__group" ref={dropdownRef}>
          <label className="controls__label">Channel (Optional)</label>
          {selectedChannel ? (
            <div className="channel-selected">
              {selectedChannel.thumbnail && (
                <img className="channel-selected__avatar" src={selectedChannel.thumbnail} alt="" />
              )}
              <span className="channel-selected__name">{selectedChannel.title}</span>
              <button className="channel-selected__clear" onClick={handleClearChannel} aria-label="Clear channel">
                ✕
              </button>
            </div>
          ) : (
            <div className="channel-search">
              <input
                type="text"
                className="input channel-search__input"
                placeholder="Search for a channel..."
                value={channelQuery}
                onChange={(e) => setChannelQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleChannelSearch();
                  }
                }}
              />
              <button
                className="channel-search__btn"
                onClick={handleChannelSearch}
                disabled={channelSearching || !channelQuery.trim()}
                aria-label="Search channels"
              >
                {channelSearching ? '...' : '🔍'}
              </button>
            </div>
          )}

          {/* Channel Dropdown */}
          <AnimatePresence>
            {showChannelDropdown && channelResults.length > 0 && (
              <motion.div
                className="channel-dropdown"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {channelResults.map((ch) => (
                  <button
                    key={ch.id}
                    className="channel-dropdown__item"
                    onClick={() => handleSelectChannel(ch)}
                  >
                    {ch.thumbnail && (
                      <img className="channel-dropdown__avatar" src={ch.thumbnail} alt="" />
                    )}
                    <div className="channel-dropdown__info">
                      <div className="channel-dropdown__title-row">
                        <span className="channel-dropdown__name">{ch.title}</span>
                        {ch.subscriberCount && (
                          <span className="channel-dropdown__subs">
                            {formatSubscribers(ch.subscriberCount)}
                          </span>
                        )}
                      </div>
                      {ch.description && (
                        <span className="channel-dropdown__desc">{ch.description}</span>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
            {showChannelDropdown && channelResults.length === 0 && !channelSearching && (
              <motion.div
                className="channel-dropdown"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <div className="channel-dropdown__empty">No channels found</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Region & Category */}
      <motion.div className="controls__row" variants={item}>
        <div className="controls__group">
          <label className="controls__label" htmlFor="region-select">Region</label>
          <select
            id="region-select"
            className="select"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="controls__group">
          <label className="controls__label" htmlFor="category-select">Category</label>
          <select
            id="category-select"
            className="select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={categoriesLoading}
          >
            <option value="">
              {categoriesLoading ? 'Loading...' : 'Any Category'}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Content Type & Duration */}
      <motion.div className="controls__row" variants={item}>
        <div className="controls__group">
          <label className="controls__label">Content Type</label>
          <div className="toggle-pill">
            <button
              className={`toggle-pill__option ${contentType === 'video' ? 'toggle-pill__option--active' : ''}`}
              onClick={() => onContentTypeChange('video')}
            >
              📺 Videos
            </button>
            <button
              className={`toggle-pill__option ${contentType === 'shorts' ? 'toggle-pill__option--active' : ''}`}
              onClick={() => onContentTypeChange('shorts')}
            >
              ⚡ Shorts
            </button>
          </div>
        </div>

        {contentType === 'video' && (
          <div className="controls__group">
            <label className="controls__label" htmlFor="duration-select">Max Duration</label>
            <select
              id="duration-select"
              className="select"
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </motion.div>

      {/* Random Button */}
      <motion.div variants={item}>
        <motion.button
          className={`random-btn ${isLoading ? 'random-btn--loading' : ''}`}
          onClick={onRandom}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
        >
          <span className="random-btn__icon">{isLoading ? '⏳' : '🎲'}</span>
          {isLoading ? 'Finding a video...' : 'Roll the Dice!'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
