import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Agent — Emergency & Practical Info Agent
 * Returns local emergency numbers, hospital areas, safety tips and currency info.
 * Runs in Phase 2 parallel alongside hotels, budget and restaurants.
 */
export async function emergencyInfoAgent({ destination }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a travel safety expert. Provide accurate, practical emergency and safety
information for destinations worldwide. Always prioritise traveller safety.`,
      },
      {
        role: 'user',
        content: `Provide emergency and practical information for a traveller visiting ${destination}.

Return ONLY a JSON object:
{
  "police": "emergency police number e.g. 911 or 110",
  "ambulance": "ambulance number e.g. 911 or 119",
  "fire": "fire brigade number",
  "generalEmergency": "single universal emergency number if available e.g. 112",
  "hospitalArea": "Name and area/district of the main public hospital or hospital district in ${destination}",
  "safetyTips": [
    "Practical safety tip 1 specific to ${destination}",
    "Tip 2",
    "Tip 3",
    "Tip 4"
  ],
  "localCurrency": "Full currency name e.g. Japanese Yen",
  "currencyCode": "3-letter ISO code e.g. JPY",
  "tippingCulture": "One sentence on tipping customs in ${destination}"
}

Use real, accurate numbers for ${destination}. If a country uses 112 as the universal emergency number, list that as generalEmergency.`,
      },
    ],
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
}
