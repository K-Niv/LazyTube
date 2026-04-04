/* Shared utility for Vercel serverless functions */

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export async function ytFetch(endpoint, params) {
  const url = new URL(`${YT_BASE}/${endpoint}`);
  params.key = process.env.YOUTUBE_API_KEY;

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    const safeMessage = res.status === 403
      ? 'API quota exceeded or access denied. Please try again later.'
      : 'Something went wrong while fetching data.';
    const err = new Error(safeMessage);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// In-memory category cache (persists across warm invocations on Vercel)
const categoryCache = new Map();

export function getCategoryCache() {
  return categoryCache;
}
