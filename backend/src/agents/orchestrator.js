import { destinationResearchAgent } from './destinationResearchAgent.js';
import { itineraryPlannerAgent } from './itineraryPlannerAgent.js';
import { hotelConciergeAgent } from './hotelConciergeAgent.js';
import { budgetAnalystAgent } from './budgetAnalystAgent.js';
import { restaurantScoutAgent } from './restaurantScoutAgent.js';
import { dayRegenerationAgent } from './dayRegenerationAgent.js';
import { emergencyInfoAgent } from './emergencyInfoAgent.js';

export async function generateTripPlan(tripDetails, onProgress = null) {
  const { destination, days, budgetType, interests, travelersType } = tripDetails;
  const emit = (stepIndex) => onProgress?.({ stepIndex });

  const hasFoodInterest = interests.some(i =>
    i.toLowerCase().includes('food') ||
    i.toLowerCase().includes('cuisine') ||
    i.toLowerCase().includes('restaurant')
  );

  // Phase 1 — Research (sequential)
  emit(0);
  const destinationContext = await destinationResearchAgent({ destination, interests, travelersType });

  // Phase 2 — All specialists in parallel; each fires its own progress event on completion
  emit(1);
  const [itineraryResult, hotelResult, budgetResult, restaurantResult, emergencyResult] = await Promise.all([
    itineraryPlannerAgent({ destination, days, budgetType, travelersType, interests, destinationContext })
      .then(r => { emit(2); return r; }),
    hotelConciergeAgent({ destination, budgetType, days, destinationContext })
      .then(r => { emit(3); return r; }),
    budgetAnalystAgent({ destination, days, budgetType, travelersType, destinationContext })
      .then(r => { emit(4); return r; }),
    (hasFoodInterest
      ? restaurantScoutAgent({ destination, budgetType, interests, destinationContext })
      : Promise.resolve({ restaurants: [] }))
      .then(r => { if (hasFoodInterest) emit(5); return r; }),
    emergencyInfoAgent({ destination }),
  ]);

  return {
    itinerary: itineraryResult.itinerary || [],
    hotels: hotelResult.hotels || [],
    estimatedBudget: budgetResult.estimatedBudget || {},
    restaurants: restaurantResult.restaurants || [],
    destinationInsights: destinationContext,
    emergencyInfo: emergencyResult || {},
  };
}

export async function regenerateDay(tripDetails, dayNumber, instruction) {
  return dayRegenerationAgent({ ...tripDetails, dayNumber, instruction });
}
