import { ytFetch, getCategoryCache } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const region = (req.query.region || 'US').toUpperCase();
    const cache = getCategoryCache();

    if (cache.has(region)) {
      return res.status(200).json(cache.get(region));
    }

    const data = await ytFetch('videoCategories', {
      part: 'snippet',
      regionCode: region,
    });

    const categories = (data.items || [])
      .filter((c) => c.snippet.assignable)
      .map((c) => ({ id: c.id, title: c.snippet.title }));

    cache.set(region, categories);
    res.status(200).json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch categories' });
  }
}
