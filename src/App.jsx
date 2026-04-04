import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Controls from './components/Controls';
import Player from './components/Player';
import Sidebar from './components/Sidebar';
import Presets from './components/Presets';
import ShortcutsModal from './components/ShortcutsModal';
import CreatePresetModal from './components/CreatePresetModal';
import { useTheme } from './hooks/useTheme';
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePresets } from './hooks/usePresets';
import { fetchCategories, searchVideos, getVideoDetails, parseDuration } from './services/api';
import { getCachedResults, setCachedResults, markVideoUsed, getUnusedVideo } from './services/cache';

const RANDOM_QUERIES = [
  'a', 'e', 'i', 'o', 'u', 'the', 'how', 'why', 'what', 'best',
  'top', 'new', 'fun', 'cool', 'life', 'day', 'world', 'love',
  'big', 'my', 'go', 'up', 'out', 'it', 'one', 'all', 'good',
];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { history, addToHistory, clearHistory } = useHistory();
  const { presets, addPreset, removePreset } = usePresets();

  // ── Filter State ──
  const [region, setRegion] = useState('US');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [contentType, setContentType] = useState('video');
  const [duration, setDuration] = useState('');
  const [query, setQuery] = useState('');

  // ── UI State ──
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isCurrentShort, setIsCurrentShort] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  // ── Auto-Roll State ──
  const [autoRoll, setAutoRoll] = useState(false);
  const [showAutoRollCountdown, setShowAutoRollCountdown] = useState(false);
  const [autoRollCountdownValue, setAutoRollCountdownValue] = useState(5);
  
  const countdownTimerRef = useRef(null);

  // ── Modals ──
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCreatePreset, setShowCreatePreset] = useState(false);

  // Ref to always have the latest handleRandom for auto-roll
  const handleRandomRef = useRef(null);

  // ── Fetch categories when region changes ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCategoriesLoading(true);
      try {
        const data = await fetchCategories(region);
        if (!cancelled) {
          setCategories(data);
          setSelectedCategory('');
        }
      } catch (err) {
        if (!cancelled) showError(err.message);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [region]);

  // ── Error handling ──
  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }

  // ── Build search params ──
  function getSearchParams() {
    return {
      query: query.trim(),
      category: selectedCategory,
      region,
      duration: contentType === 'shorts' ? 'short' : duration,
      contentType,
    };
  }

  // ── Core search logic ──
  const handleRandom = useCallback(async (overrideParams) => {
    // Clear any active countdown if user manually triggered random
    clearAutoRollCountdown();
    
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      const params = overrideParams || getSearchParams();

      // 1. Try cache first
      const cachedVideo = getUnusedVideo(params);
      if (cachedVideo) {
        await selectVideo(cachedVideo, params);
        setIsLoading(false);
        return;
      }

      // 2. Search via API
      const searchQ = params.query
        ? params.query
        : RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];

      const apiPayload = {
        category: params.category,
        region: params.region,
        duration: params.duration,
        maxResults: 50,
      };
      if (searchQ) apiPayload.q = searchQ;

      const data = await searchVideos(apiPayload);
      const items = data.items || [];

      if (items.length === 0) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      // 3. Shorts filtering
      if (params.contentType === 'shorts') {
        const ids = items.map((i) => i.id.videoId).filter(Boolean);
        const detailsData = await getVideoDetails(ids);

        const shorts = (detailsData.items || []).filter((v) => {
          const dur = parseDuration(v.contentDetails.duration);
          return dur > 0 && dur <= 60;
        });

        if (shorts.length === 0) {
          setIsNotFound(true);
          setIsLoading(false);
          return;
        }

        const searchMap = new Map(items.map((i) => [i.id.videoId, i]));
        const enrichedShorts = shorts.map((s) => {
          const search = searchMap.get(s.id);
          return {
            videoId: s.id,
            title: s.snippet?.title || search?.snippet?.title || 'Untitled',
            thumbnail: s.snippet?.thumbnails?.medium?.url || search?.snippet?.thumbnails?.medium?.url,
            channel: s.snippet?.channelTitle || search?.snippet?.channelTitle,
            isShort: true,
          };
        });

        setCachedResults(params, enrichedShorts);
        const picked = enrichedShorts[Math.floor(Math.random() * enrichedShorts.length)];
        markVideoUsed(params, picked.videoId);
        setCurrentVideo(picked);
        setIsCurrentShort(true);
        addToHistory(picked);
      } else {
        const enriched = items
          .filter((i) => i.id?.videoId)
          .map((i) => ({
            videoId: i.id.videoId,
            title: i.snippet?.title || 'Untitled',
            thumbnail: i.snippet?.thumbnails?.medium?.url,
            channel: i.snippet?.channelTitle,
            isShort: false,
          }));

        setCachedResults(params, enriched);
        const picked = enriched[Math.floor(Math.random() * enriched.length)];
        markVideoUsed(params, picked.videoId);
        setCurrentVideo(picked);
        setIsCurrentShort(false);
        addToHistory(picked);
      }
    } catch (err) {
      showError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [region, selectedCategory, contentType, duration, query, addToHistory]);

  useEffect(() => { handleRandomRef.current = handleRandom; }, [handleRandom]);

  // ── Handlers & Auto-Roll logic ──
  const clearAutoRollCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setShowAutoRollCountdown(false);
    setAutoRollCountdownValue(5);
  };

  const handleVideoEnd = () => {
    if (!autoRoll) return;

    setShowAutoRollCountdown(true);
    setAutoRollCountdownValue(5);
    
    let time = 5;
    countdownTimerRef.current = setInterval(() => {
      time -= 1;
      if (time > 0) {
        setAutoRollCountdownValue(time);
      } else {
        clearAutoRollCountdown();
        handleRandomRef.current();
      }
    }, 1000);
  };

  // If user disables AutoRoll mid-countdown, stop it
  useEffect(() => {
    if (!autoRoll) {
      clearAutoRollCountdown();
    }
  }, [autoRoll]);

  // ── Custom Presets ──
  function handlePresetApply(preset) {
    setSelectedCategory(preset.category || '');
    setContentType(preset.contentType || 'video');
    setDuration(preset.duration || '');
    setQuery(preset.query || '');
    setActivePreset(preset.name);

    handleRandom({
      query: preset.query || '',
      category: preset.category || '',
      region,
      duration: preset.contentType === 'shorts' ? 'short' : preset.duration || '',
      contentType: preset.contentType || 'video',
    });
  }

  function handleSavePreset(presetDetails) {
    addPreset(presetDetails);
  }

  // ── Select video ──
  async function selectVideo(video, params) {
    const vid = {
      videoId: video.videoId || video.id?.videoId,
      title: video.title || video.snippet?.title || 'Untitled',
      thumbnail: video.thumbnail || video.snippet?.thumbnails?.medium?.url,
      channel: video.channel || video.snippet?.channelTitle,
      isShort: video.isShort || false,
    };
    if (params) markVideoUsed(params, vid.videoId);
    setCurrentVideo(vid);
    setIsCurrentShort(vid.isShort);
    addToHistory(vid);
  }

  function handleHistorySelect(item) {
    clearAutoRollCountdown();
    setCurrentVideo(item);
    setIsCurrentShort(item.isShort || false);
    addToHistory(item);
  }

  useKeyboardShortcuts({
    ' ': () => { if (!isLoading) handleRandomRef.current(); },
    'r': () => { if (!isLoading) handleRandomRef.current(); },
    't': toggleTheme,
    'a': () => setAutoRoll((prev) => !prev),
    '?': () => setShowShortcuts((prev) => !prev),
    'escape': () => {
      setShowShortcuts(false);
      setShowCreatePreset(false);
    },
  });

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowShortcuts={() => setShowShortcuts(true)}
        autoRoll={autoRoll}
        onAutoRollToggle={() => setAutoRoll((prev) => !prev)}
      />

      <div className="app__body">
        <main className="app__main">
          {/* Player */}
          <Player 
            video={currentVideo} 
            isShort={isCurrentShort} 
            isNotFound={isNotFound}
            onEnd={handleVideoEnd}
            showAutoRollCountdown={showAutoRollCountdown}
            autoRollCountdownValue={autoRollCountdownValue}
          />

          {/* User Custom Presets */}
          <Presets 
            presets={presets}
            onPreset={handlePresetApply}
            onAdd={() => setShowCreatePreset(true)}
            onRemove={removePreset}
            isLoading={isLoading} 
            activePreset={activePreset} 
          />

          {/* Controls */}
          <Controls
            region={region}
            onRegionChange={(v) => { setRegion(v); setActivePreset(null); }}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={(v) => { setSelectedCategory(v); setActivePreset(null); }}
            contentType={contentType}
            onContentTypeChange={(v) => { setContentType(v); setActivePreset(null); }}
            duration={duration}
            onDurationChange={(v) => { setDuration(v); setActivePreset(null); }}
            query={query}
            onQueryChange={(v) => { setQuery(v); setActivePreset(null); }}
            onRandom={() => { setActivePreset(null); handleRandom(); }}
            isLoading={isLoading}
            categoriesLoading={categoriesLoading}
          />
        </main>

        <Sidebar
          history={history}
          onSelect={handleHistorySelect}
          onClear={clearHistory}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="error-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      
      <CreatePresetModal 
        isOpen={showCreatePreset} 
        onClose={() => setShowCreatePreset(false)} 
        onSave={handleSavePreset}
        currentFilters={{
          contentType,
          duration,
          category: selectedCategory,
          query
        }}
      />
    </div>
  );
}
