import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const budgetMap = { low: 'budget/backpacker', medium: 'moderate/mid-range', high: 'luxury' };

/**
 * Agent 6 — Day Regeneration Agent
 * Role: Regenerates a single day's activities based on user instructions.
 * Produces fresh, different activities from the original plan.
 */
export async function dayRegenerationAgent({ destination, days, budgetType, travelersType, dayNumber, instruction }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a creative travel planner specialising in customising itineraries.
When asked to regenerate a day, you always produce fresh, different activities that match
the traveler's preferences and any specific instructions they provide.`,
      },
      {
        role: 'user',
        content: `Regenerate Day ${dayNumber} of a ${days}-day trip to ${destination}.

Traveler type: ${travelersType}
Budget: ${budgetMap[budgetType]}
Special instruction: "${instruction || 'Make it varied and interesting, different from typical tourist spots'}"

Return ONLY a JSON object:
{
  "day": ${dayNumber},
  "theme": "Descriptive theme for this regenerated day",
  "activities": [
    {
      "time": "9:00 AM",
      "title": "Specific activity name",
      "description": "2-sentence engaging description",
      "ticketPrice": "Free or $XX",
      "rating": "4.X/5",
      "photoKeyword": "descriptive keyword for image search"
    }
  ]
}

Generate 3-5 fresh activities that honour the instruction. Different from generic tourist spots.`,
      },
    ],
    temperature: 0.9,
  });

  return JSON.parse(response.choices[0].message.content);
}
