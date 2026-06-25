import { destinationResearchAgent } from './destinationResearchAgent.js';
import { itineraryPlannerAgent } from './itineraryPlannerAgent.js';
import { hotelConciergeAgent } from './hotelConciergeAgent.js';
import { budgetAnalystAgent } from './budgetAnalystAgent.js';
import { restaurantScoutAgent } from './restaurantScoutAgent.js';
import { dayRegenerationAgent } from './dayRegenerationAgent.js';
import { emergencyInfoAgent } from './emergencyInfoAgent.js';

export async function generateTripPlan(tripDetails) {
  const { destination, days, budgetType, interests, travelersType } = tripDetails;

  // Phase 1 — Sequential: research the destination first
  const destinationContext = await destinationResearchAgent({ destination, interests, travelersType });

  // Phase 2 — Parallel: all specialist agents use the research context
  const hasFoodInterest = interests.some(i =>
    i.toLowerCase().includes('food') ||
    i.toLowerCase().includes('cuisine') ||
    i.toLowerCase().includes('restaurant')
  );

  const [itineraryResult, hotelResult, budgetResult, restaurantResult, emergencyResult] = await Promise.all([
    itineraryPlannerAgent({ destination, days, budgetType, travelersType, interests, destinationContext }),
    hotelConciergeAgent({ destination, budgetType, days, destinationContext }),
    budgetAnalystAgent({ destination, days, budgetType, travelersType, destinationContext }),
    hasFoodInterest
      ? restaurantScoutAgent({ destination, budgetType, interests, destinationContext })
      : Promise.resolve({ restaurants: [] }),
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
