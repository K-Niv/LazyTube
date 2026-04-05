import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// Trust proxy (required for correct IP detection behind reverse proxies)
app.set('trust proxy', 1);

// Security headers (YouTube-safe CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://s.ytimg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.ytimg.com", "https://i.ytimg.com"],
      frameSrc: ["https://www.youtube.com"],
      connectSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
    },
  },
}));

// CORS — restrict to known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

/* ── Rate Limiting (in-memory, per-IP) ──
   15 requests/minute per IP.
   Rationale:
   - Each search.list call costs 100 of 10,000 daily quota → ~100 searches/day.
   - A normal user clicks the dice maybe 5-10x in a burst, then watches.
   - 15/min prevents automated abuse while allowing comfortable human usage.
   - Initial page load needs 1 call (categories), each dice roll needs 1-2 calls.
*/
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 15;
const ipRequestLog = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!ipRequestLog.has(ip)) {
    ipRequestLog.set(ip, []);
  }

  const timestamps = ipRequestLog.get(ip).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  ipRequestLog.set(ip, timestamps);

  if (timestamps.length > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.',
    });
  }
  next();
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestLog.entries()) {
    const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      ipRequestLog.delete(ip);
    } else {
      ipRequestLog.set(ip, active);
    }
  }
}, 5 * 60 * 1000);

app.use('/api', rateLimiter);

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
    // Sanitize: never forward raw YouTube error messages (may reference the API key)
    const safeMessage = res.status === 403
      ? 'API quota exceeded or access denied. Please try again later.'
      : 'Something went wrong while fetching data.';
    throw { status: res.status, message: safeMessage };
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
      return res.json(categoryCache.get(region));
    }

    const data = await ytFetch('videoCategories', {
      part: 'snippet',
      regionCode: region,
    });

    const categories = (data.items || [])
      .filter((c) => c.snippet.assignable)
      .map((c) => ({ id: c.id, title: c.snippet.title }));

    categoryCache.set(region, categories);
    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

// GET /api/search?category=10&region=US&duration=short&maxResults=50&channelId=UC...
app.get('/api/search', async (req, res) => {
  try {
    const { category, region, duration, maxResults, pageToken, q, channelId } = req.query;

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
    if (channelId) params.channelId = channelId;

    // Randomize time window for variety
    if (!pageToken) {
      const now = Date.now();
      const tenYearsAgo = now - 10 * 365 * 24 * 60 * 60 * 1000;
      const randomTime = new Date(tenYearsAgo + Math.random() * (now - tenYearsAgo));
      params.publishedBefore = randomTime.toISOString();
    }

    const data = await ytFetch('search', params);
    res.json(data);
  } catch (err) {
    console.error('Search error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Search failed' });
  }
});

// GET /api/channels?q=MrBeast
app.get('/api/channels', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q parameter required' });

    const data = await ytFetch('search', {
      part: 'snippet',
      type: 'channel',
      q,
      maxResults: '5',
    });

    const channels = (data.items || []).map((ch) => ({
      id: ch.snippet.channelId,
      title: ch.snippet.channelTitle,
      thumbnail: ch.snippet.thumbnails?.default?.url,
      description: ch.snippet.description,
    }));

    res.json(channels);
  } catch (err) {
    console.error('Channel search error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Channel search failed' });
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
    res.json(data);
  } catch (err) {
    console.error('Video details error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch video details' });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ LazyTube API server running on http://localhost:${PORT}`);
  if (!API_KEY || API_KEY === 'your_youtube_api_key_here') {
    console.warn('⚠️  YOUTUBE_API_KEY not set in .env — API calls will fail!');
  }
});
