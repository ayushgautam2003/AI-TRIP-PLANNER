import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const budgetMap = { low: 'budget/backpacker', medium: 'moderate/mid-range', high: 'luxury' };

function buildPrompt({ destination, days, budgetType, interests, travelersType }) {
  const includeRestaurants = interests.some(i =>
    i.toLowerCase().includes('food') || i.toLowerCase().includes('cuisine') || i.toLowerCase().includes('restaurant')
  );

  return `You are an expert travel planner. Generate a complete travel plan as valid JSON.

Trip details:
- Destination: ${destination}
- Duration: EXACTLY ${days} day(s) — you MUST generate exactly ${days} days, no more, no less
- Budget: ${budgetMap[budgetType]}
- Traveler type: ${travelersType}
- Interests: ${interests.length ? interests.join(', ') : 'general sightseeing'}

Return ONLY a valid JSON object with this EXACT structure:
{
  "itinerary": [
    {
      "day": 1,
      "theme": "Arrival & City Highlights",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Senso-ji Temple",
          "description": "Tokyo's oldest and most famous Buddhist temple in Asakusa.",
          "ticketPrice": "Free",
          "rating": "4.8/5",
          "photoKeyword": "senso-ji temple tokyo"
        }
      ]
    }
  ],
  "hotels": [
    {
      "name": "Hotel Name",
      "type": "Budget / Mid-Range / Luxury",
      "pricePerNight": "$80/night",
      "rating": "4.2/5",
      "amenities": ["Free WiFi", "Breakfast included"],
      "description": "Brief hotel description"
    }
  ],${includeRestaurants ? `
  "restaurants": [
    {
      "name": "Restaurant Name",
      "cuisine": "Local / Italian / Japanese",
      "priceRange": "$10-20 per person",
      "rating": "4.5/5",
      "specialty": "Signature dish name",
      "description": "Brief description of the restaurant",
      "photoKeyword": "japanese ramen restaurant"
    }
  ],` : ''}
  "estimatedBudget": {
    "flights": "$400",
    "accommodation": "$300",
    "food": "$150",
    "activities": "$100",
    "total": "$950",
    "currency": "USD"
  }
}

STRICT RULES:
- Generate EXACTLY ${days} day entries in itinerary array (Day 1 through Day ${days})
- Each day must have 3-5 activities with realistic times
- photoKeyword must be a descriptive search term like "eiffel tower paris" or "tokyo street food"
- Suggest exactly 3 hotels matching ${budgetMap[budgetType]} budget
${includeRestaurants ? `- Include 4-5 restaurant recommendations for ${destination} with realistic price ranges` : ''}
- Budget estimates must reflect ${budgetMap[budgetType]} travel for ${days} days in ${destination}
- All prices must be realistic for ${destination}`;
}

function buildRegenerateDayPrompt({ destination, days, budgetType, travelersType, dayNumber, instruction }) {
  return `You are an expert travel planner. Regenerate Day ${dayNumber} of a ${days}-day trip to ${destination}.

Traveler type: ${travelersType}
Budget: ${budgetMap[budgetType]}
Special instruction: ${instruction || 'Make it varied and interesting'}

Return ONLY a JSON object:
{
  "day": ${dayNumber},
  "theme": "Day theme",
  "activities": [
    {
      "time": "9:00 AM",
      "title": "Activity name",
      "description": "Brief description",
      "ticketPrice": "$10 or Free",
      "rating": "4.5/5",
      "photoKeyword": "descriptive search term for photo"
    }
  ]
}

Generate 3-5 activities different from the usual tourist spots.`;
}

export async function generateTripPlan(tripDetails) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: buildPrompt(tripDetails) }],
    temperature: 0.7,
  });
  return JSON.parse(response.choices[0].message.content);
}

export async function regenerateDay(tripDetails, dayNumber, instruction) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: buildRegenerateDayPrompt({ ...tripDetails, dayNumber, instruction }) }],
    temperature: 0.9,
  });
  return JSON.parse(response.choices[0].message.content);
}
