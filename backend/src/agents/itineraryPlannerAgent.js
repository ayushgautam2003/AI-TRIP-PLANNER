import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const budgetMap = { low: 'budget/backpacker', medium: 'moderate/mid-range', high: 'luxury' };

const INTEREST_RULES = {
  'Nightlife': {
    rule: 'MUST include 1–2 activities scheduled AFTER 8:00 PM every day.',
    types: 'rooftop bars, cocktail lounges, live music venues, jazz bars, nightclubs, night markets, evening shows, sky bars',
    example: '"9:00 PM – Rooftop Bar at [specific venue]", "11:00 PM – Live Jazz at [venue name]"',
  },
  'Food & Cuisine': {
    rule: 'MUST weave authentic food experiences throughout the day at real meal times.',
    types: 'local food markets, street food stalls, authentic restaurants, food tours, cooking classes, signature dish tastings',
    example: '"8:00 AM – Local Morning Market & Street Breakfast", "1:00 PM – Authentic [cuisine] Restaurant", "7:30 PM – Famous Local Dish Dinner"',
  },
  'Adventure & Sports': {
    rule: 'MUST include 1–2 physical/outdoor adventure activities, preferably in the morning.',
    types: 'hiking trails, water sports, cycling tours, rock climbing, zip-lining, kayaking, surfing, paragliding',
    example: '"7:00 AM – Sunrise Hike to [viewpoint]", "10:00 AM – Kayaking at [river/lake]"',
  },
  'Culture & History': {
    rule: 'MUST include visits to historical and cultural sites.',
    types: 'ancient temples, historical monuments, palace tours, heritage walks, archaeological sites, traditional ceremonies, historical districts',
    example: '"9:00 AM – [Famous Temple/Monument] Guided Tour", "2:00 PM – Heritage Walking Tour of Old City"',
  },
  'Art & Museums': {
    rule: 'MUST include art and creative experiences at specific venues.',
    types: 'contemporary art galleries, art museums, street art districts, photography exhibitions, creative workshops, design studios',
    example: '"10:00 AM – [City] Museum of Art", "3:00 PM – Street Art Walking Tour of [district]"',
  },
  'Shopping': {
    rule: 'MUST include authentic local shopping experiences, not generic malls.',
    types: 'local artisan markets, boutique shopping streets, night bazaars, craft markets, souvenir districts, antique markets',
    example: '"3:00 PM – [Famous Market Name] Artisan Market", "6:00 PM – Night Bazaar at [district]"',
  },
  'Nature & Outdoors': {
    rule: 'MUST include outdoor nature experiences, scheduled in cooler morning or late afternoon hours.',
    types: 'national parks, scenic viewpoints, botanical gardens, waterfalls, lakes, mountain trails, coastal walks',
    example: '"7:30 AM – Sunrise at [Scenic Viewpoint]", "4:00 PM – Walk through [Botanical Garden/Park]"',
  },
  'Wellness & Spa': {
    rule: 'MUST include wellness and relaxation experiences.',
    types: 'traditional spa treatments, Thai/Balinese/local massage, yoga classes, meditation sessions, hot springs, wellness centres',
    example: '"8:00 AM – Morning Yoga at [studio/beach]", "5:00 PM – Traditional [type] Massage"',
  },
};

function buildInterestSection(interests) {
  if (!interests.length) return '';
  const rules = interests
    .map(i => INTEREST_RULES[i])
    .filter(Boolean)
    .map(r => `• ${r.rule}\n  Activity types: ${r.types}\n  Example: ${r.example}`)
    .join('\n\n');
  return rules ? `\n\nMANDATORY INTEREST RULES — enforce strictly for every day:\n${rules}` : '';
}

/**
 * Agent 2 — Itinerary Planner Agent
 * Creates interest-driven, time-structured day-by-day itineraries.
 */
export async function itineraryPlannerAgent({ destination, days, budgetType, travelersType, interests, destinationContext }) {
  const hasNightlife = interests.includes('Nightlife');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert travel itinerary planner. You create highly personalised, realistic
day-by-day itineraries that strictly follow the traveller's interests and budget.
You always structure activities realistically across morning, afternoon, evening — and night when Nightlife is selected.
You name specific real venues, markets, restaurants, bars and landmarks — never generic descriptions.`,
      },
      {
        role: 'user',
        content: `Plan EXACTLY ${days} day(s) in ${destination} for a ${travelersType} traveller on a ${budgetMap[budgetType]} budget.

Selected interests: ${interests.length ? interests.join(', ') : 'general sightseeing'}
${buildInterestSection(interests)}

Destination research context:
${JSON.stringify(destinationContext, null, 2)}

TIME-OF-DAY STRUCTURE — every single day must follow this:
• Morning (7:00 AM – 12:00 PM): 2 activities — energetic start, local breakfast experience or adventure
• Afternoon (1:00 PM – 5:00 PM): 1–2 activities — main landmarks, museums, markets, relaxed exploration
• Evening (6:00 PM – 9:00 PM): 1 activity — sunset viewpoint, dinner, cultural show, evening stroll
${hasNightlife ? '• Night (9:00 PM – 12:00 AM): 1–2 activities — bars, clubs, night markets (MANDATORY every night)' : ''}

Return ONLY a JSON object with EXACTLY ${days} day entries:
{
  "itinerary": [
    {
      "day": 1,
      "theme": "Punchy, specific theme e.g. 'Street Food & Hidden Temples'",
      "activities": [
        {
          "time": "8:00 AM",
          "title": "Specific real place or experience name",
          "description": "2-sentence vivid description of what the traveller will do and experience",
          "ticketPrice": "Free or $XX USD",
          "rating": "4.X/5",
          "photoKeyword": "3–5 word descriptive image search term e.g. 'senso-ji temple tokyo dawn'"
        }
      ]
    }
  ]
}

STRICT RULES:
1. Generate EXACTLY ${days} days (Day 1 through Day ${days}) — no more, no less
2. 4–6 activities per day spread across ALL time slots (morning to ${hasNightlife ? 'night' : 'evening'})
3. Use SPECIFIC real place names — never say "a local restaurant", say the actual name or district
4. Activities must DIRECTLY reflect the selected interests: ${interests.length ? interests.join(', ') : 'general sightseeing'}
5. The theme for each day must reflect the primary interest of that day's activities
6. Budget tier is ${budgetMap[budgetType]} — match prices, venues, and experiences accordingly
7. photoKeyword must be a vivid, specific 3–5 word term for accurate image search`,
      },
    ],
    temperature: 0.75,
  });

  return JSON.parse(response.choices[0].message.content);
}
