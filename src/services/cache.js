/* ── Client-side Cache — localStorage with params-hash keys ── */

const CACHE_PREFIX = 'lt_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique hash key from search parameters
 */
async function generateHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// We'll use a synchronous simple hash to avoid making makeKey async
function makeKey(params) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  // Full base64 string ensures uniqueness, removed the aggressive .slice(0,40)
  return CACHE_PREFIX + btoa(unescape(encodeURIComponent(sorted))).replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Get cached results for given search params.
 * Returns { items: [...], timestamp } or null if miss/expired.
 */
export function getCachedResults(params) {
  try {
    const key = makeKey(params);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

/**
 * Store search results in cache.
 */
export function setCachedResults(params, items) {
  try {
    const key = makeKey(params);
    const data = { items, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full — clear old caches
    clearOldCaches();
  }
}

/**
 * Mark a video as "used" in its cache entry so we don't repeat it.
 */
export function markVideoUsed(params, videoId) {
  try {
    const key = makeKey(params);
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const cached = JSON.parse(raw);
    if (!cached.usedIds) cached.usedIds = [];
    cached.usedIds.push(videoId);
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

/**
 * Get an unused video from cache.
 */
export function getUnusedVideo(params) {
  const cached = getCachedResults(params);
  if (!cached || !cached.items || cached.items.length === 0) return null;

  const usedIds = new Set(cached.usedIds || []);
  const unused = cached.items.filter((v) => !usedIds.has(v.id?.videoId || v.videoId));

  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

/**
 * Clear expired caches
 */
function clearOldCaches() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
  for (const key of keys) {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}
