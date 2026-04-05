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

    res.status(200).json(channels);
  } catch (err) {
    console.error('Channel search error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Channel search failed' });
  }
}
