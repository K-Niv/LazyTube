import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

/* ── Quota tracking (in-memory, resets daily) ── */
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();

function trackQuota(cost) {
  const today = new Date().toDateString();
  if (today !== quotaResetDate) {
    quotaUsed = 0;
    quotaResetDate = today;
  }
  quotaUsed += cost;
}

function attachQuotaHeaders(res) {
  res.set('X-Quota-Used', String(quotaUsed));
  res.set('X-Quota-Limit', '10000');
}

/* ── Helpers ── */
async function ytFetch(endpoint, params) {
  const url = new URL(`${YT_BASE}/${endpoint}`);
  params.key = API_KEY;
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, message: err?.error?.message || res.statusText };
  }
  return res.json();
}

/* ── Category cache (per region, rarely changes) ── */
const categoryCache = new Map();

/* ── Routes ── */

// GET /api/categories?region=US
app.get('/api/categories', async (req, res) => {
  try {
    const region = (req.query.region || 'US').toUpperCase();

    if (categoryCache.has(region)) {
      attachQuotaHeaders(res);
      return res.json(categoryCache.get(region));
    }

    const data = await ytFetch('videoCategories', {
      part: 'snippet',
      regionCode: region,
    });
    trackQuota(1);

    const categories = (data.items || [])
      .filter((c) => c.snippet.assignable)
      .map((c) => ({ id: c.id, title: c.snippet.title }));

    categoryCache.set(region, categories);
    attachQuotaHeaders(res);
    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// GET /api/search?category=10&region=US&duration=short&maxResults=50&pageToken=...
app.get('/api/search', async (req, res) => {
  try {
    const { category, region, duration, maxResults, pageToken, q } = req.query;

    const params = {
      part: 'snippet',
      type: 'video',
      videoEmbeddable: 'true',
      maxResults: maxResults || '50',
      regionCode: (region || 'US').toUpperCase(),
      order: 'date',
      safeSearch: 'moderate',
    };

    if (category) params.videoCategoryId = category;
    if (duration) params.videoDuration = duration;
    if (pageToken) params.pageToken = pageToken;
    if (q) params.q = q;

    // Randomize time window for variety
    if (!pageToken) {
      const now = Date.now();
      const tenYearsAgo = now - 10 * 365 * 24 * 60 * 60 * 1000;
      const randomTime = new Date(tenYearsAgo + Math.random() * (now - tenYearsAgo));
      params.publishedBefore = randomTime.toISOString();
    }

    const data = await ytFetch('search', params);
    trackQuota(100);

    attachQuotaHeaders(res);
    res.json(data);
  } catch (err) {
    console.error('Search error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Search failed' });
  }
});

// GET /api/video-details?ids=id1,id2,id3
app.get('/api/video-details', async (req, res) => {
  try {
    const ids = req.query.ids;
    if (!ids) return res.status(400).json({ error: 'ids parameter required' });

    const data = await ytFetch('videos', {
      part: 'contentDetails,snippet',
      id: ids,
    });
    trackQuota(1);

    attachQuotaHeaders(res);
    res.json(data);
  } catch (err) {
    console.error('Video details error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch video details' });
  }
});

// GET /api/quota
app.get('/api/quota', (_req, res) => {
  const today = new Date().toDateString();
  if (today !== quotaResetDate) {
    quotaUsed = 0;
    quotaResetDate = today;
  }
  res.json({ used: quotaUsed, limit: 10000, remaining: 10000 - quotaUsed });
});

app.listen(PORT, () => {
  console.log(`⚡ LazyTube API server running on http://localhost:${PORT}`);
  if (!API_KEY || API_KEY === 'your_youtube_api_key_here') {
    console.warn('⚠️  YOUTUBE_API_KEY not set in .env — API calls will fail!');
  }
});
