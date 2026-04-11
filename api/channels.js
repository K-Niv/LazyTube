import { ytFetch } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const q = req.query.q;
    if (!q) {
      return res.status(400).json({ error: 'q parameter required' });
    }

    const searchData = await ytFetch('search', {
      part: 'snippet',
      type: 'channel',
      q,
      maxResults: '5',
    });

    const items = searchData.items || [];
    if (items.length === 0) {
      return res.status(200).json([]);
    }

    const channelIds = items.map((i) => i.snippet.channelId).join(',');
    const detailsData = await ytFetch('channels', {
      part: 'snippet,statistics',
      id: channelIds,
    });

    const detailsMap = new Map();
    (detailsData.items || []).forEach((ch) => {
      detailsMap.set(ch.id, ch);
    });

    const channels = items.map((ch) => {
      const id = ch.snippet.channelId;
      const details = detailsMap.get(id);
      return {
        id,
        title: ch.snippet.channelTitle,
        thumbnail: details?.snippet?.thumbnails?.default?.url || ch.snippet.thumbnails?.default?.url,
        description: ch.snippet.description,
        subscriberCount: details?.statistics?.subscriberCount || null,
      };
    });

    res.status(200).json(channels);
  } catch (err) {
    console.error('Channel search error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Channel search failed' });
  }
}
