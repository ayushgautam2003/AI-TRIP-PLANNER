import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const budgetMap = { low: 'budget/backpacker', medium: 'moderate/mid-range', high: 'luxury' };

/**
 * Agent 3 — Hotel Concierge Agent
 * Role: Recommends 3 hotels perfectly matched to the traveler's budget tier and location.
 * Uses destination context to recommend hotels in the best areas.
 */
export async function hotelConciergeAgent({ destination, budgetType, days, destinationContext }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a luxury travel concierge specialising in hotel recommendations worldwide.
You match hotels to traveler budgets and provide honest, detailed assessments including real amenities
and accurate price ranges. You prioritise hotels in well-connected, safe neighbourhoods.`,
      },
      {
        role: 'user',
        content: `Recommend exactly 3 hotels in ${destination} for a ${budgetMap[budgetType]} traveller staying ${days} night(s).

Best areas in ${destination}: ${destinationContext?.bestAreas?.join(', ') || destination}

Return ONLY a JSON object:
{
  "hotels": [
    {
      "name": "Real hotel name",
      "type": "${budgetType === 'low' ? 'Budget' : budgetType === 'medium' ? 'Mid-Range' : 'Luxury'}",
      "neighbourhood": "Which area of ${destination} it is in",
      "pricePerNight": "$XX/night",
      "rating": "4.X/5",
      "amenities": ["Amenity 1", "Amenity 2", "Amenity 3"],
      "description": "2-sentence compelling hotel description",
      "whyWeRecommend": "One specific reason this hotel suits this traveler"
    }
  ]
}

All 3 hotels must be ${budgetMap[budgetType]} tier. Include range from best value to premium within that tier.`,
      },
    ],
    temperature: 0.6,
  });

  return JSON.parse(response.choices[0].message.content);
}
