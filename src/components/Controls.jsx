import React from 'react';

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
  onRandom,
  isLoading,
  categoriesLoading,
}) {
  return (
    <div className="controls">
      {/* Row 1: Search Query */}
      <div className="controls__row" style={{ marginBottom: '-8px' }}>
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
              if (e.key === 'Enter' && !isLoading) {
                onRandom();
              }
            }}
          />
        </div>
      </div>

      {/* Row 2: Region & Category */}
      <div className="controls__row">
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
      </div>

      {/* Row 2: Content Type & Duration */}
      <div className="controls__row">
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
      </div>

      {/* Random Button */}
      <button
        className={`random-btn ${isLoading ? 'random-btn--loading' : ''}`}
        onClick={onRandom}
        disabled={isLoading}
      >
        <span className="random-btn__icon">{isLoading ? '⏳' : '🎲'}</span>
        {isLoading ? 'Finding a video...' : 'Roll the Dice!'}
      </button>
    </div>
  );
}
