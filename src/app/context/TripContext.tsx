import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface TripPlan {
  id: string;
  destination: string;
  budget: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
  duration: number;
  activities: string[];
  createdAt: Date;
  itinerary?: DailySchedule[];
  createdAt: Date;
  itinerary?: DailySchedule[];
  isCompleted?: boolean;
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
  destination: string;
  budget: 'budget' | 'mid-range' | 'luxury';
  groupSize: number;
  duration: number;
  activities: string[];
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
  generateItinerary: (tripId: string) => Promise<DailySchedule[]>;
  refresh: () => Promise<void>;
  toggleTripCompletion: (id: string, isCompleted: boolean) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

function buildGroqPrompt(i: { destination: string; budget: string; groupSize: number; duration: number; activities: string[] }): string {
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

function fromRow(r: any): TripPlan {
  return {
    id: r.id,
    destination: r.destination,
    budget: r.budget,
    groupSize: r.group_size,
    duration: r.duration,
    activities: r.activities ?? [],
    createdAt: new Date(r.created_at),
    itinerary: r.itinerary ?? undefined,
    isCompleted: r.is_completed ?? false, 
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
    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        destination: input.destination,
        budget: input.budget,
        group_size: input.groupSize,
        duration: input.duration,
        activities: input.activities,
      })
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
    const { error } = await supabase.from('trips').update({ is_completed: isCompleted }).eq('id', id);
    if (error) throw error;
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted } : t)));
    if (currentTrip?.id === id) setCurrentTrip({ ...currentTrip, isCompleted });
  };

  const generateItinerary = async (tripId: string): Promise<DailySchedule[]> => {
    // Trip may not be in local state yet if called immediately after createTrip
    let trip = trips.find((t) => t.id === tripId);
    if (!trip) {
      const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).single();
      if (error || !data) throw new Error('Trip not found');
      trip = fromRow(data);
    }

    const body = {
      destination: trip.destination,
      budget: trip.budget,
      groupSize: trip.groupSize,
      duration: trip.duration,
      activities: trip.activities,
    };

    let itineraryData: any;

    // Try Edge Function first; fall back to direct Groq call if not deployed yet
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
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You output ONLY valid JSON. Never include explanations.' },
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

    const itinerary: DailySchedule[] = itineraryData?.days ?? itineraryData?.itinerary ?? itineraryData;

    const { error: updateError } = await supabase
      .from('trips')
      .update({ itinerary })
      .eq('id', tripId);
    if (updateError) throw updateError;

    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, itinerary } : t)));
    if (currentTrip?.id === tripId) setCurrentTrip({ ...currentTrip, itinerary });

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
