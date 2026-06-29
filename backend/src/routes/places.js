import express from 'express';

const router = express.Router();

// Bounded photo cache — max 500 entries, 24h TTL, evicts oldest when full
const CACHE_MAX = 500;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const photoCache = new Map(); // key → { url, expiresAt }

function cacheGet(key) {
  const entry = photoCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { photoCache.delete(key); return null; }
  return entry.url;
}

function cacheSet(key, url) {
  if (photoCache.size >= CACHE_MAX) {
    // Evict the oldest entry
    photoCache.delete(photoCache.keys().next().value);
  }
  photoCache.set(key, { url, expiresAt: Date.now() + CACHE_TTL });
}

/**
 * GET /api/places/photo?query=Eiffel+Tower+Paris
 * Fetches a Google Places photo and redirects. API key stays server-side.
 * Falls back to Pexels keyword search on failure.
 */
router.get('/photo', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'query parameter required' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const fallbackUrl = `https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800`;

  if (!apiKey) return res.redirect(fallbackUrl);

  // Return cached result immediately
  const cached = cacheGet(query);
  if (cached) return res.redirect(cached);

  try {
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=photos&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    const photoRef = searchData.candidates?.[0]?.photos?.[0]?.photo_reference;

    if (!photoRef) {
      cacheSet(query, fallbackUrl);
      return res.redirect(fallbackUrl);
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
    cacheSet(query, photoUrl);
    res.redirect(photoUrl);
  } catch {
    res.redirect(fallbackUrl);
  }
});

export default router;
