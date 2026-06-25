import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  time: String,
  title: { type: String, required: true },
  description: String,
  ticketPrice: String,
  rating: String,
  photoKeyword: String,
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  theme: String,
  activities: [activitySchema],
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  neighbourhood: String,
  pricePerNight: String,
  rating: String,
  amenities: [String],
  description: String,
  whyWeRecommend: String,
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  name: String,
  cuisine: String,
  priceRange: String,
  rating: String,
  specialty: String,
  description: String,
  bestFor: String,
  neighbourhood: String,
  photoKeyword: String,
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  flights: String,
  accommodation: String,
  food: String,
  activities: String,
  localTransport: String,
  miscellaneous: String,
  total: String,
  currency: { type: String, default: 'USD' },
  budgetTip: String,
}, { _id: false });

const destinationInsightsSchema = new mongoose.Schema({
  overview: String,
  bestAreas: [String],
  localTips: [String],
  weatherNote: String,
  culturalNotes: [String],
  transportTips: String,
  mustSeeHighlights: [String],
}, { _id: false });

const emergencyInfoSchema = new mongoose.Schema({
  police: String,
  ambulance: String,
  fire: String,
  generalEmergency: String,
  hospitalArea: String,
  safetyTips: [String],
  localCurrency: String,
  currencyCode: String,
  tippingCulture: String,
}, { _id: false });

const tripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  destination: { type: String, required: true },
  destinationPlaceId: String,
  days: { type: Number, required: true, min: 1, max: 30 },
  budgetType: { type: String, enum: ['low', 'medium', 'high'], required: true },
  interests: [{ type: String }],
  travelersType: { type: String, required: true },
  itinerary: [daySchema],
  hotels: [hotelSchema],
  restaurants: [restaurantSchema],
  estimatedBudget: budgetSchema,
  destinationInsights: destinationInsightsSchema,
  emergencyInfo: emergencyInfoSchema,
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);
