import express from 'express';
import OpenAI from 'openai';
import { protect } from '../middleware/auth.js';
import Trip from '../models/Trip.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/packing/:tripId — generate a packing list for a trip
router.post('/:tripId', protect, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const activityTitles = trip.itinerary
      .flatMap(d => d.activities.map(a => a.title))
      .slice(0, 10)
      .join(', ');

    const prompt = `You are a professional travel packer. Generate a smart packing list for this trip.

Trip details:
- Destination: ${trip.destination}
- Duration: ${trip.days} day(s)
- Budget: ${trip.budgetType}
- Traveler type: ${trip.travelersType}
- Planned activities: ${activityTitles || 'general sightseeing'}

Return ONLY a JSON object with this structure:
{
  "categories": [
    {
      "name": "Category Name",
      "icon": "emoji",
      "items": [
        { "name": "Item name", "essential": true, "note": "optional short tip" }
      ]
    }
  ],
  "tips": ["Quick packing tip 1", "Quick packing tip 2"]
}

Categories to include: Documents & Money, Clothing, Toiletries, Electronics, Health & Safety, Destination-specific extras.
Mark truly essential items as essential: true. Include 4-8 items per category. Give 3 practical tips.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
    });

    const packingList = JSON.parse(response.choices[0].message.content);
    res.json({ packingList });
  } catch {
    res.status(500).json({ message: 'Failed to generate packing list.' });
  }
});

export default router;
