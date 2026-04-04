import { ytFetch } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    res.status(200).json(data);
  } catch (err) {
    console.error('Search error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Search failed' });
  }
}
