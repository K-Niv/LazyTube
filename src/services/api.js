/* ── API Service — calls our backend (not YouTube directly) ── */

const API_BASE = '/api';

export async function fetchCategories(regionCode = 'US') {
  const res = await fetch(`${API_BASE}/categories?region=${encodeURIComponent(regionCode)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch categories');
  }
  return await res.json();
}

export async function searchVideos({ category, region, duration, q, channelId, maxResults = 50 }) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (region) params.set('region', region);
  if (duration) params.set('duration', duration);
  if (q) params.set('q', q);
  if (channelId) params.set('channelId', channelId);
  params.set('maxResults', String(maxResults));

  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Search failed');
  }
  return await res.json();
}

export async function searchChannels(query) {
  const res = await fetch(`${API_BASE}/channels?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Channel search failed');
  }
  return await res.json();
}

export async function getVideoDetails(ids) {
  const res = await fetch(`${API_BASE}/video-details?ids=${encodeURIComponent(ids.join(','))}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch video details');
  }
  return await res.json();
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
export function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}
