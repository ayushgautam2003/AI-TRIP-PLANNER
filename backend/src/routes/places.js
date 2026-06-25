import express from 'express';

const router = express.Router();

// In-memory cache: query string → resolved photo URL
const photoCache = new Map();

/**
 * GET /api/places/photo?query=Senso-ji+Temple+Tokyo
 *
 * Fetches a real Google Places photo for the given search query and
 * redirects to the actual CDN image. API key stays server-side.
 * Falls back to an Unsplash keyword search on failure.
 */
router.get('/photo', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'query parameter required' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.redirect(`https://source.unsplash.com/featured/600x400/?${encodeURIComponent(query)}`);
  }

  // Return cached result immediately
  if (photoCache.has(query)) {
    return res.redirect(photoCache.get(query));
  }

  try {
    // Step 1: Find place and get photo_reference
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=photos&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const photoRef = searchData.candidates?.[0]?.photos?.[0]?.photo_reference;

    if (!photoRef) {
      const fallback = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(query)}`;
      photoCache.set(query, fallback);
      return res.redirect(fallback);
    }

    // Step 2: Build the photo URL (Google redirects to CDN)
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
    photoCache.set(query, photoUrl);
    res.redirect(photoUrl);
  } catch {
    const fallback = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(query)}`;
    res.redirect(fallback);
  }
});

export default router;
