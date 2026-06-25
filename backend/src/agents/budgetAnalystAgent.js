import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const budgetMap = { low: 'budget/backpacker', medium: 'moderate/mid-range', high: 'luxury' };

/**
 * Agent 4 — Budget Analyst Agent
 * Role: Calculates a realistic cost breakdown for the entire trip.
 * Factors in local cost of living, seasonality, and traveler budget tier.
 */
export async function budgetAnalystAgent({ destination, days, budgetType, travelersType, destinationContext }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a travel budget analyst with expertise in global travel costs.
You provide accurate, realistic cost estimates based on destination, duration, and budget tier.
Your estimates account for local cost of living, exchange rates, and typical traveler spending patterns.`,
      },
      {
        role: 'user',
        content: `Calculate a realistic budget breakdown for a ${budgetMap[budgetType]} trip to ${destination}.

Trip details:
- Duration: ${days} day(s)
- Traveler type: ${travelersType}
- Budget tier: ${budgetMap[budgetType]}
- Destination overview: ${destinationContext?.overview || destination}

Return ONLY a JSON object with realistic USD estimates:
{
  "estimatedBudget": {
    "flights": "$XXX (round trip estimate)",
    "accommodation": "$XXX (${days} night(s) total)",
    "food": "$XXX (${days} day(s) total)",
    "activities": "$XXX (${days} day(s) total)",
    "localTransport": "$XXX (${days} day(s) total)",
    "miscellaneous": "$XXX (shopping, tips, etc.)",
    "total": "$XXX",
    "currency": "USD",
    "budgetTip": "One practical money-saving tip specific to ${destination}"
  }
}

Prices must be realistic for ${destination} at ${budgetMap[budgetType]} level for ${days} days.`,
      },
    ],
    temperature: 0.4,
  });

  return JSON.parse(response.choices[0].message.content);
}
