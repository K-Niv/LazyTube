import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import Player from './components/Player';
import Sidebar from './components/Sidebar';
import { useTheme } from './hooks/useTheme';
import { useHistory } from './hooks/useHistory';
import { fetchCategories, searchVideos, getVideoDetails, fetchQuota, parseDuration } from './services/api';
import { getCachedResults, setCachedResults, markVideoUsed, getUnusedVideo } from './services/cache';

// Random single-char / short queries to add variety to search results
const RANDOM_QUERIES = [
  'a', 'e', 'i', 'o', 'u', 'the', 'how', 'why', 'what', 'best',
  'top', 'new', 'fun', 'cool', 'life', 'day', 'world', 'love',
  'big', 'my', 'go', 'up', 'out', 'it', 'one', 'all', 'good',
];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { history, addToHistory, clearHistory } = useHistory();

  // ── State ──
  const [region, setRegion] = useState('US');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [contentType, setContentType] = useState('video'); // 'video' | 'shorts'
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isCurrentShort, setIsCurrentShort] = useState(false);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState({ used: 0, limit: 10000 });

  // ── Fetch categories when region changes ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCategoriesLoading(true);
      try {
        const { data, quota: q } = await fetchCategories(region);
        if (!cancelled) {
          setCategories(data);
          setSelectedCategory('');
          if (q) setQuota(q);
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

  // ── Fetch quota on mount ──
  useEffect(() => {
    fetchQuota().then(setQuota).catch(() => {});
  }, []);

  // ── Error handling ──
  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }

  // ── Build search params object for caching ──
  function getSearchParams() {
    return {
      category: selectedCategory,
      region,
      duration: contentType === 'shorts' ? 'short' : duration,
      contentType,
    };
  }

  // ── Handle Random ──
  const handleRandom = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = getSearchParams();

      // 1. Try cache first
      const cachedVideo = getUnusedVideo(params);
      if (cachedVideo) {
        await selectVideo(cachedVideo, params);
        setIsLoading(false);
        return;
      }

      // 2. Search via API
      const randomQ = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
      const { data, quota: q } = await searchVideos({
        category: params.category,
        region: params.region,
        duration: params.duration,
        q: randomQ,
        maxResults: 50,
      });

      if (q) setQuota(q);

      const items = data.items || [];
      if (items.length === 0) {
        showError('No videos found. Try a different category or region.');
        setIsLoading(false);
        return;
      }

      // 3. For shorts: filter by actual duration ≤ 60s
      if (contentType === 'shorts') {
        const ids = items.map((i) => i.id.videoId).filter(Boolean);
        const { data: detailsData, quota: q2 } = await getVideoDetails(ids);
        if (q2) setQuota(q2);

        const shorts = (detailsData.items || []).filter((v) => {
          const dur = parseDuration(v.contentDetails.duration);
          return dur > 0 && dur <= 60;
        });

        if (shorts.length === 0) {
          showError('No shorts found. Try a different category.');
          setIsLoading(false);
          return;
        }

        // Merge snippet info from search results with details
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
        // Regular videos
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
  }, [region, selectedCategory, contentType, duration, addToHistory]);

  // ── Select video (from cache or history) ──
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

  // ── Handle history click ──
  function handleHistorySelect(item) {
    setCurrentVideo(item);
    setIsCurrentShort(item.isShort || false);
    // Re-add to top of history
    addToHistory(item);
  }

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} quota={quota} />

      <div className="app__body">
        <main className="app__main">
          <Controls
            region={region}
            onRegionChange={setRegion}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            contentType={contentType}
            onContentTypeChange={setContentType}
            duration={duration}
            onDurationChange={setDuration}
            onRandom={handleRandom}
            isLoading={isLoading}
            categoriesLoading={categoriesLoading}
          />

          <Player video={currentVideo} isShort={isCurrentShort} />
        </main>

        <Sidebar
          history={history}
          onSelect={handleHistorySelect}
          onClear={clearHistory}
        />
      </div>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}
