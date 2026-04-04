import { ytFetch } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ids = req.query.ids;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter required' });
    }

    const data = await ytFetch('videos', {
      part: 'contentDetails,snippet',
      id: ids,
    });

    res.status(200).json(data);
  } catch (err) {
    console.error('Video details error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch video details' });
  }
}
