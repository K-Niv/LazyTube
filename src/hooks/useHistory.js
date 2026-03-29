import { useState, useCallback } from 'react';

const HISTORY_KEY = 'lt_history';
const MAX_HISTORY = 100;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState(loadHistory);

  const addToHistory = useCallback((video) => {
    setHistory((prev) => {
      // Avoid duplicates at the top
      const filtered = prev.filter((v) => v.videoId !== video.videoId);
      const updated = [
        {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channel: video.channel,
          isShort: video.isShort || false,
          watchedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_HISTORY);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}
