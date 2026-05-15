import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface TripPlan {
  id: string;
  origin: string;
  destination: string;
  budget: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
  duration: number;
  activities: string[];
  startDate?: Date;
  createdAt: Date;
  itinerary?: DailySchedule[];
  isCompleted?: boolean;
  estimatedTransportFee: number;
}

export interface DailySchedule {
  day: number;
  date: string;
  activities: Activity[];
  estimatedCost: number;
}

export interface Activity {
  id: string;
  time: string;
  name: string;
  description: string;
  category: string;
  location: { lat: number; lng: number; address: string };
  estimatedCost: number;
  duration: string;
}

interface CreateTripInput {
  origin: string;
  destination: string;
  budget: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
  duration: number;
  activities: string[];
  startDate?: string;
  endDate?: string;
  currentTime?: string | null;
  isSameDay?: boolean;
}

interface TripContextType {
  trips: TripPlan[];
  currentTrip: TripPlan | null;
  loading: boolean;
  createTrip: (input: CreateTripInput) => Promise<string>;
  deleteTrip: (id: string) => Promise<void>;
  setCurrentTrip: (trip: TripPlan | null) => void;
  generateItinerary: (tripId: string) => Promise<DailySchedule[]>;
  refresh: () => Promise<void>;
  toggleTripCompletion: (id: string, isCompleted: boolean) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface PromptInput {
  origin: string;
  destination: string;
  budget: string;
  groupSize: number;
  duration: number;
  activities: string[];
  startDate?: string; // ISO string e.g. "2025-05-20T00:00:00.000Z"
}


function buildDayDates(startDate: string | undefined, duration: number): string[] {
  const base = startDate ? new Date(startDate) : new Date();
  // Use noon to stay safely away from DST / UTC-offset midnight edge cases
  base.setHours(12, 0, 0, 0);
  return Array.from({ length: duration }, (_, d) => {
    const day = new Date(base);
    day.setDate(base.getDate() + d);
    // Use LOCAL date getters — NOT toISOString() which converts to UTC
    // and shifts the date back for UTC+ timezones (PH = UTC+8)
    const y = day.getFullYear();
    const mo = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dd}`;
  });
}


function estimateTransportFee(
  origin: string,
  destination: string,
  groupSize: number,
  duration: number,
  budget: string,
): number {
  const o = origin.toLowerCase().trim();
  const d = destination.toLowerCase().trim();

  // Local-only trip
  if (o === d || o === '') {
    const perPersonPerDay = budget === 'luxury' ? 800 : budget === 'mid-range' ? 500 : 300;
    return perPersonPerDay * groupSize * duration;
  }

  // Inter-city: airfare/ferry lookup (round-trip per person)
  const key = [o, d].sort().join('|');
  const airfareMap: Record<string, number> = {
    'cebu|manila': 5000,
    'cebu|metro manila': 5000,
    'cebu|palawan': 6500,
    'cebu|puerto princesa': 6500,
    'cebu|siargao': 5500,
    'cebu|boracay': 7000,
    'cebu|caticlan': 7000,
    'cebu|bohol': 1200,    // short ferry
    'cebu|dumaguete': 600, // fast ferry
    'cebu|iloilo': 3500,
    'manila|palawan': 6000,
    'manila|puerto princesa': 6000,
    'manila|siargao': 6000,
    'manila|bohol': 5500,
    'manila|tagbilaran': 5500,
    'manila|davao': 5000,
    'manila|boracay': 5500,
    'manila|caticlan': 5500,
    'manila|cebu': 5000,
    'manila|iloilo': 4500,
    'manila|dumaguete': 5000,
    'manila|batangas': 800,
    'baguio|manila': 1200,
    'tagaytay|manila': 500,
  };

  const airfarePP = airfareMap[key] ?? 4500;

  // Local commutes at destination (per person per day)
  const localPerPersonPerDay = budget === 'luxury' ? 800 : budget === 'mid-range' ? 500 : 300;
  const localTotal = localPerPersonPerDay * groupSize * duration;

  return airfarePP * groupSize + localTotal;
}

function buildGroqPrompt(i: PromptInput): string {
  const isInterCity =
    i.origin.toLowerCase().trim() !== i.destination.toLowerCase().trim() && i.origin !== '';

  const transportNote = isInterCity
    ? `CRITICAL: The trip is from ${i.origin} to ${i.destination} — these are DIFFERENT cities.
- You MUST calculate a realistic round-trip intercity fare (airplane / ferry / bus) for ${i.groupSize} person(s).
- PLUS add local commute costs (Grab/taxi/jeepney/tricycle) at the destination for all ${i.duration} days for ${i.groupSize} person(s).
- Typical budget airline round-trip fares (per person): Cebu↔Manila ≈ ₱4,000–₱8,000; Cebu↔Palawan ≈ ₱5,000–₱9,000; Manila↔Siargao ≈ ₱5,000–₱8,000.
- Local daily commutes ≈ ₱300–₱800 per person per day depending on budget tier.
- The "estimatedTransportFee" field MUST be a positive integer greater than 0. Never return 0 for an inter-city trip.`
    : `The trip is within ${i.destination} only.
- estimatedTransportFee = local commutes only (Grab/taxi/jeepney/tricycle) for ${i.groupSize} person(s) × ${i.duration} days.
- Typical ₱300–₱800 per person per day. Must be a positive integer greater than 0.`;

  return `You are nimnim, an AI travel planner specializing in the Philippines.
Generate a realistic day-by-day itinerary for the trip below.

INPUT
- Origin: ${i.origin || 'not specified'}
- Destination: ${i.destination}, Philippines
- Budget tier: ${i.budget}
- Group size: ${i.groupSize}
- Duration: ${i.duration} days
- Activity preferences: ${i.activities.join(', ')}

TRANSPORT & FARES (READ CAREFULLY)
${transportNote}

REQUIREMENTS
- Use REAL place names, REAL latitude/longitude, and REAL approximate prices in PHP for ${i.destination}.
- 5–10 activities per day spread across morning / midday / afternoon / evening.
- Costs are in PHP per person for activities.
- Times in 24-hour "HH:MM" format.
- The "date" field in each day can be left as "YYYY-MM-DD" — it will be corrected server-side.
- Respond with ONLY valid JSON — no prose, no markdown fences.

JSON SHAPE
{
  "estimatedTransportFee": <REQUIRED positive integer PHP — intercity fares + local commutes for ALL ${i.groupSize} people>,
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "estimatedCost": <int total PHP for the day's activities for ALL ${i.groupSize} people>,
      "activities": [
        {
          "id": "d1-a1",
          "time": "09:00",
          "name": "string",
          "description": "string",
          "category": "Culture|Food|Beach|Adventure|Relaxation|Shopping|Nightlife|Nature|Photography|Tourist Spots",
          "duration": "string e.g. '2 hours'",
          "estimatedCost": <int PHP per person>,
          "location": { "lat": <float>, "lng": <float>, "address": "string" }
        }
      ]
    }
  ]
}`;
}
// ─────────────────────────────────────────────────────────────────────────────

function fromRow(r: any): TripPlan {
  return {
    id: r.id,
    origin: r.origin,
    destination: r.destination,
    budget: r.budget,
    groupSize: r.group_size,
    duration: r.duration,
    activities: r.activities ?? [],
    startDate: r.start_date ? new Date(r.start_date) : new Date(r.created_at),
    createdAt: new Date(r.created_at),
    itinerary: r.itinerary ?? undefined,
    isCompleted: r.is_completed ?? false,
    estimatedTransportFee: r.estimated_transport_fee ?? 0,
  };
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setTrips(data.map(fromRow));
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) refresh();
    else {
      setTrips([]);
      setCurrentTrip(null);
    }
  }, [isAuthenticated, user?.id]);

  const createTrip = async (input: CreateTripInput): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    const payload: any = {
      user_id: user.id,
      origin: input.origin,
      destination: input.destination,
      budget: input.budget,
      group_size: input.groupSize,
      duration: input.duration,
      activities: input.activities,
      // ✅ Save the user-selected start date so ScheduleView shows correct dates
      start_date: input.startDate ?? null,
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    const trip = fromRow(data);
    setTrips((prev) => [trip, ...prev]);
    setCurrentTrip(trip);
    return trip.id;
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (currentTrip?.id === id) setCurrentTrip(null);
  };

  const toggleTripCompletion = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('trips')
      .update({ is_completed: isCompleted })
      .eq('id', id);
    if (error) throw error;
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted } : t)));
    if (currentTrip?.id === id) setCurrentTrip({ ...currentTrip, isCompleted });
  };

  const generateItinerary = async (tripId: string): Promise<DailySchedule[]> => {
    let trip = trips.find((t) => t.id === tripId);
    if (!trip) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (error || !data) throw new Error('Trip not found');
      trip = fromRow(data);
    }

    const body: PromptInput = {
      origin: trip.origin,
      destination: trip.destination,
      budget: trip.budget,
      groupSize: trip.groupSize,
      duration: trip.duration,
      activities: trip.activities,
      // ✅ Pass the real start date so the AI assigns correct calendar dates
      startDate: trip.startDate ? trip.startDate.toISOString() : undefined,
    };

    let itineraryData: any;

    const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
      'generate-itinerary',
      { body }
    );

    if (edgeError) {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) {
        throw new Error(
          'nimnim unavailable: deploy the generate-itinerary Edge Function OR add VITE_GROQ_API_KEY to your .env file.'
        );
      }

      const prompt = buildGroqPrompt(body);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'You output ONLY valid JSON. Never include explanations, prose, or markdown fences.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
      const groqJson = await res.json();
      const content = groqJson?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from Groq');
      itineraryData = JSON.parse(content);
    } else {
      itineraryData = edgeData;
    }

    // ── 1. FIX DATES ─────────────────────────────────────────────────────────
    // Never trust the AI for calendar dates — always overwrite with the
    // real dates computed from the user's chosen startDate.
    const dayDates = buildDayDates(body.startDate, trip.duration);
    const rawDays: any[] = itineraryData?.days ?? itineraryData?.itinerary ?? itineraryData ?? [];
    const itinerary: DailySchedule[] = rawDays.map((day: any, idx: number) => ({
      ...day,
      date: dayDates[idx] ?? day.date ?? '',
    }));

    // ── 2. FIX TRANSPORT FEE ─────────────────────────────────────────────────
    // If the AI returns 0 (or anything suspiciously low for an inter-city trip),
    // fall back to our own estimator so the UI never shows ₱0 for a flight route.
    const aiTransportFee: number = itineraryData?.estimatedTransportFee ?? 0;
    const isInterCity =
      trip.origin.toLowerCase().trim() !== trip.destination.toLowerCase().trim() &&
      trip.origin !== '';
    const minReasonableFee = isInterCity ? 1000 : 200; // sanity threshold
    const transportFee: number =
      aiTransportFee >= minReasonableFee
        ? aiTransportFee
        : estimateTransportFee(trip.origin, trip.destination, trip.groupSize, trip.duration, trip.budget);

    const { error: updateError } = await supabase
      .from('trips')
      .update({
        itinerary,
        estimated_transport_fee: transportFee,
      })
      .eq('id', tripId);
    if (updateError) throw updateError;

    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId ? { ...t, itinerary, estimatedTransportFee: transportFee } : t
      )
    );
    if (currentTrip?.id === tripId)
      setCurrentTrip({ ...currentTrip, itinerary, estimatedTransportFee: transportFee });

    return itinerary;
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        currentTrip,
        loading,
        createTrip,
        deleteTrip,
        setCurrentTrip,
        generateItinerary,
        refresh,
        toggleTripCompletion,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within a TripProvider');
  return ctx;
}