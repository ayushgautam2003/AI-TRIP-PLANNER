import express from 'express';
import Trip from '../models/Trip.js';
import { protect } from '../middleware/auth.js';
import { generateTripPlan, regenerateDay } from '../agents/orchestrator.js';

const router = express.Router();
router.use(protect);

// POST /api/trips — orchestrate all agents + save trip
router.post('/', async (req, res) => {
  const { destination, destinationPlaceId, days, budgetType, interests, travelersType } = req.body;

  if (!destination || !days || !budgetType || !travelersType)
    return res.status(400).json({ message: 'destination, days, budgetType and travelersType are required' });

  if (days < 1 || days > 30)
    return res.status(400).json({ message: 'Days must be between 1 and 30' });

  try {
    const result = await generateTripPlan({ destination, days, budgetType, interests: interests || [], travelersType });

    const trip = await Trip.create({
      userId: req.user._id,
      destination,
      destinationPlaceId,
      days,
      budgetType,
      interests: interests || [],
      travelersType,
      itinerary: result.itinerary,
      hotels: result.hotels,
      restaurants: result.restaurants,
      estimatedBudget: result.estimatedBudget,
      destinationInsights: result.destinationInsights,
      emergencyInfo: result.emergencyInfo,
    });

    res.status(201).json({ trip });
  } catch {
    res.status(500).json({ message: 'Failed to generate trip. Please try again.' });
  }
});

// GET /api/trips
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch {
    res.status(500).json({ message: 'Could not fetch trips.' });
  }
});

// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Could not fetch trip.' });
  }
});

// PUT /api/trips/:id — update itinerary/notes
router.put('/:id', async (req, res) => {
  const { itinerary, notes } = req.body;
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (itinerary !== undefined) trip.itinerary = itinerary;
    if (notes !== undefined) trip.notes = notes;
    await trip.save();
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Could not update trip.' });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch {
    res.status(500).json({ message: 'Could not delete trip.' });
  }
});

// POST /api/trips/:id/regenerate-day — Day Regeneration Agent
router.post('/:id/regenerate-day', async (req, res) => {
  const { dayNumber, instruction } = req.body;
  if (!dayNumber) return res.status(400).json({ message: 'dayNumber is required' });

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const newDay = await regenerateDay(
      { destination: trip.destination, days: trip.days, budgetType: trip.budgetType, travelersType: trip.travelersType },
      dayNumber,
      instruction
    );

    const idx = trip.itinerary.findIndex(d => d.day === dayNumber);
    if (idx !== -1) trip.itinerary[idx] = newDay;
    else trip.itinerary.push(newDay);

    trip.markModified('itinerary');
    await trip.save();
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Failed to regenerate day. Please try again.' });
  }
});

// POST /api/trips/:id/full-regenerate — re-run all agents with new params
router.post('/:id/full-regenerate', async (req, res) => {
  const { destination, destinationPlaceId, days, budgetType, interests, travelersType } = req.body;

  if (!destination || !days || !budgetType || !travelersType)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const result = await generateTripPlan({ destination, days, budgetType, interests: interests || [], travelersType });

    trip.destination = destination;
    trip.destinationPlaceId = destinationPlaceId || trip.destinationPlaceId;
    trip.days = days;
    trip.budgetType = budgetType;
    trip.interests = interests || [];
    trip.travelersType = travelersType;
    trip.itinerary = result.itinerary;
    trip.hotels = result.hotels;
    trip.restaurants = result.restaurants;
    trip.estimatedBudget = result.estimatedBudget;
    trip.destinationInsights = result.destinationInsights;
    trip.emergencyInfo = result.emergencyInfo;

    await trip.save();
    res.json({ trip });
  } catch {
    res.status(500).json({ message: 'Failed to regenerate trip. Please try again.' });
  }
});

export default router;
