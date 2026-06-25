import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const budgetMap = { low: 'budget/backpacker', medium: 'moderate/mid-range', high: 'luxury' };

/**
 * Agent 5 — Restaurant Scout Agent
 * Role: Finds the best restaurants and food experiences for the destination.
 * Only invoked when the traveler has food/cuisine interests.
 */
export async function restaurantScoutAgent({ destination, budgetType, interests, destinationContext }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a culinary travel scout and food journalist who discovers the best dining
experiences worldwide. You know local restaurants, street food spots, and fine dining venues.
You match restaurant recommendations to traveler budgets and food preferences.`,
      },
      {
        role: 'user',
        content: `Scout the best restaurants and food experiences in ${destination} for a ${budgetMap[budgetType]} traveller.

Food interests: ${interests.filter(i => i.toLowerCase().includes('food') || i.toLowerCase().includes('cuisine')).join(', ') || 'local cuisine'}
Destination context: ${destinationContext?.overview || destination}

Return ONLY a JSON object with 4-5 restaurant recommendations:
{
  "restaurants": [
    {
      "name": "Restaurant name",
      "cuisine": "Cuisine type",
      "priceRange": "$X-XX per person",
      "rating": "4.X/5",
      "specialty": "Must-order dish or item",
      "description": "2-sentence description of the dining experience",
      "bestFor": "Breakfast / Lunch / Dinner / Snacks",
      "neighbourhood": "Which part of ${destination} it is in",
      "photoKeyword": "descriptive keyword e.g. japanese ramen bowl"
    }
  ]
}

Mix of: local/street food, mid-range restaurants, and one special dining experience.
All must be realistic for ${destination} and ${budgetMap[budgetType]} budget.`,
      },
    ],
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content);
}
