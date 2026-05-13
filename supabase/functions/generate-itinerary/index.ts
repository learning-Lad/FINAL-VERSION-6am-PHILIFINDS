// Supabase Edge Function: generate-itinerary
// Calls Groq (OpenAI-compatible) to produce a JSON itinerary for nimnim.
// Deploy with:  supabase functions deploy generate-itinerary
// Set secret with: supabase secrets set GROQ_API_KEY=gsk_xxx

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ItineraryInput {
  destination: string;
  budget: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
  duration: number;
  activities: string[];
}

function buildPrompt(i: ItineraryInput): string {
  return `You are nimnim, an AI travel planner specializing in the Philippines.
Generate a realistic day-by-day itinerary for the trip below.

INPUT
- Destination: ${i.destination}, Philippines
- Budget tier: ${i.budget}
- Group size: ${i.groupSize}
- Duration: ${i.duration} days
- Activity preferences: ${i.activities.join(', ')}

REQUIREMENTS
- Use REAL place names, REAL latitude/longitude, and REAL approximate prices in PHP for ${i.destination}.
- 3-4 activities per day, spread across morning / midday / afternoon / evening.
- Costs in PHP per person (integers, no currency symbols).
- Times in 24h "HH:MM" format.
- Respond with ONLY valid JSON. No prose, no markdown fences.

JSON SHAPE
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "estimatedCost": <int total PHP for the day>,
      "activities": [
        {
          "id": "d1-a1",
          "time": "09:00",
          "name": "string",
          "description": "string",
          "category": "Culture|Food|Beach|Adventure|Relaxation|Shopping|Nightlife|Nature|Photography|Tourist Spots",
          "duration": "string e.g. '2 hours'",
          "estimatedCost": <int>,
          "location": { "lat": <float>, "lng": <float>, "address": "string" }
        }
      ]
    }
  ]
}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let input: ItineraryInput;
  try {
    input = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!input?.destination || !input?.duration) {
    return new Response(JSON.stringify({ error: 'destination and duration are required' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You output ONLY valid JSON. Never include explanations.' },
        { role: 'user', content: buildPrompt(input) },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return new Response(JSON.stringify({ error: 'Groq API error', detail: errText }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const groqJson = await groqRes.json();
  const content = groqJson?.choices?.[0]?.message?.content;
  if (!content) {
    return new Response(JSON.stringify({ error: 'Empty Groq response' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return new Response(JSON.stringify({ error: 'Groq returned non-JSON', raw: content }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
