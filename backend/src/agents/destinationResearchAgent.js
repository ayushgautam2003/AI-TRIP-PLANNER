import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Agent 1 — Destination Research Agent
 * Gathers local intelligence AND interest-specific venue lists used by all Phase 2 agents.
 */
export async function destinationResearchAgent({ destination, interests, travelersType }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a destination research specialist with deep local knowledge worldwide.
You provide accurate, specific local intelligence — including real venue names, real district names,
and interest-specific hotspots — that other planning agents use to build better itineraries.`,
      },
      {
        role: 'user',
        content: `Research ${destination} for a ${travelersType} traveller with these interests: ${interests.length ? interests.join(', ') : 'general sightseeing'}.

Return ONLY a JSON object:
{
  "overview": "2–3 sentence overview of what makes ${destination} special for travellers",
  "bestAreas": ["Neighbourhood/area 1 — one-line reason", "Area 2", "Area 3"],
  "localTips": ["Specific practical tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "weatherNote": "Current season and what weather to expect, what to pack",
  "culturalNotes": ["Important cultural note 1", "Note 2"],
  "transportTips": "How to best get around ${destination} — specific transit options with names",
  "mustSeeHighlights": ["Top real attraction 1", "Attraction 2", "Attraction 3", "Attraction 4"],
  "interestVenues": {
    "nightlife": ["Real club/bar/venue name 1 and district", "Venue 2", "Venue 3"],
    "food": ["Real restaurant/market/street food area 1", "Venue 2", "Venue 3"],
    "adventure": ["Real outdoor/adventure spot 1", "Spot 2"],
    "culture": ["Real heritage/temple/monument 1", "Site 2", "Site 3"],
    "art": ["Real gallery/museum/street art district 1", "Venue 2"],
    "shopping": ["Real market/shopping street 1", "Area 2", "Area 3"],
    "nature": ["Real park/viewpoint/nature area 1", "Area 2"],
    "wellness": ["Real spa/wellness centre 1", "Venue 2"]
  }
}

interestVenues must contain REAL, named places in ${destination}. Leave arrays empty if not applicable.`,
      },
    ],
    temperature: 0.5,
  });

  return JSON.parse(response.choices[0].message.content);
}
