import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useTrip, type Activity, type TripPlan, type DailySchedule } from '../context/TripContext';
import { supabase } from '../lib/supabase';
import { Plane, MapPin, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
    isCompleted: r.is_completed ?? false, // Make sure we read the DB column here!
  };
}

export function ScheduleView() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  // Pull in the toggle function from our Trip Context
  const { trips, toggleTripCompletion } = useTrip();
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    let active = true;

    const local = trips.find((t) => t.id === tripId);
    if (local) {
      setTrip(local);
      setLoading(false);
      return;
    }

    if (!tripId) {
      navigate('/dashboard');
      return;
    }

    (async () => {
      const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).single();
      if (!active) return;
      if (error || !data) {
        navigate('/dashboard');
        return;
      }
      setTrip(fromRow(data));
      setLoading(false);
    })();

    return () => { active = false; };
  }, [tripId, trips, navigate]);

  const itinerary: DailySchedule[] | undefined = trip?.itinerary;
  const allMarkers = useMemo(() => itinerary?.flatMap((d) => d.activities) ?? [], [itinerary]);

  const center = useMemo(() => {
    if (allMarkers.length === 0) return [12.8797, 121.7740] as [number, number]; // PH center
    const lat = allMarkers.reduce((s, a) => s + a.location.lat, 0) / allMarkers.length;
    const lng = allMarkers.reduce((s, a) => s + a.location.lng, 0) / allMarkers.length;
    return [lat, lng] as [number, number];
  }, [allMarkers]);

  // Calculate accurate dates based on when the trip was created!
  const getFormattedDate = (dayNum: number) => {
    if (!trip) return '';
    const date = new Date(trip.createdAt);
    date.setDate(date.getDate() + (dayNum - 1)); // Day 1 = +0 days, Day 2 = +1 day, etc.
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5ef] flex items-center justify-center text-[#2d5840]">
        Loading your itinerary…
      </div>
    );
  }

  if (!trip || !itinerary || itinerary.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f5ef] flex items-center justify-center px-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1f3d2b] mb-2">No itinerary yet</h2>
          <p className="text-gray-600 mb-6">This trip hasn't been planned yet.</p>
          <button
            onClick={() => navigate('/planner/setup')}
            className="px-6 py-3 rounded-full text-white text-sm font-medium shadow-md"
            style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
          >
            Plan a new trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5ef]">
      <header className="px-8 py-5 flex items-center justify-between bg-white/70 backdrop-blur border-b border-[#e8e4d6]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-[#2d5840] hover:underline flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-[#2d5840]">
            <Plane className="w-6 h-6" />
            <span className="font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>PhiliFinds</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-[#1f3d2b]">{trip.destination}</div>
          <div className="text-xs text-gray-500">
            {trip.duration} days • {trip.groupSize} {trip.groupSize === 1 ? 'person' : 'people'} • <span className="capitalize">{trip.budget}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <p className="text-[#2d5840] italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Your nimnim itinerary
        </p>
        <h1 className="text-4xl font-bold text-[#1f3d2b] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          {trip.destination} Trip
        </h1>

        {/* Map */}
        <Card className="mb-6 overflow-hidden border-0 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-0">
            <div className="h-[420px]">
              <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {allMarkers.map((a) => (
                  <Marker key={a.id} position={[a.location.lat, a.location.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold text-[#1f3d2b]">{a.name}</div>
                        <div className="text-gray-600">{a.description}</div>
                        <div className="text-xs text-gray-500 mt-1">{a.location.address}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="border-0 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-[#1f3d2b] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Daily Schedule
            </h2>
            <Tabs value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
              <TabsList className="w-full flex-wrap h-auto bg-[#eef0e8]">
                {itinerary.map((day) => (
                  <TabsTrigger key={day.day} value={String(day.day)} className="flex-1 min-w-[100px]">
                    Day {day.day}
                    <span className="ml-2 text-xs text-gray-500">{getFormattedDate(day.day)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {itinerary.map((day) => (
                <TabsContent key={day.day} value={String(day.day)} className="mt-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-[#1f3d2b]">
                      Day {day.day} · {getFormattedDate(day.day)}
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Estimated Cost</p>
                      <p className="text-xl font-bold text-[#2d5840]">
                        ₱{day.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {day.activities.map((activity, i) => (
                      <ActivityCard key={activity.id ?? `${day.day}-${i}`} activity={activity} index={i} />
                    ))}
                  </div>

                  <div className="pt-4 mt-4 border-t flex justify-between items-center">
                    <span className="font-semibold text-[#1f3d2b]">Total for Day {day.day}:</span>
                    <span className="text-xl font-bold text-[#2d5840]">
                      ₱{day.activities.reduce((s, a) => s + (a.estimatedCost ?? 0), 0).toLocaleString()}
                    </span>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Trip Summary (Updated with Completed Button) */}
        <Card className="mt-6 border-0 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="grid md:grid-cols-2 gap-6 flex-1 w-full">
              <div>
                <h4 className="text-sm text-gray-500 mb-2">Total Estimated Cost</h4>
                <p className="text-3xl font-bold text-[#2d5840]">
                  ₱{itinerary.reduce((s, d) => s + (d.estimatedCost ?? 0), 0).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-2">Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {trip.activities.map((a) => (
                    <Badge key={a} className="bg-[#e8efe6] text-[#1f3d2b] hover:bg-[#e8efe6]">{a}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* NEW COMPLETED BUTTON */}
            <div className="shrink-0 w-full md:w-auto flex justify-start md:justify-end mt-4 md:mt-0">
              <button
                onClick={async () => {
                  if (!toggleTripCompletion) return;
                  try {
                    await toggleTripCompletion(trip.id, !trip.isCompleted);
                    setTrip({ ...trip, isCompleted: !trip.isCompleted }); // Instantly update the UI
                  } catch (e) {
                    console.error("Failed to update status", e);
                  }
                }}
                className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 font-medium transition-all duration-300 w-full md:w-auto ${
                  trip.isCompleted 
                    ? 'bg-[#e8efe6] text-[#2d5840] border border-[#2d5840] hover:bg-[#d8e6d5]' 
                    : 'bg-gradient-to-r from-[#5fa476] to-[#2d5840] text-white hover:opacity-90 shadow-md'
                }`}
              >
                <CheckCircle className={`w-5 h-5 ${trip.isCompleted ? 'text-[#2d5840]' : 'text-white'}`} />
                {trip.isCompleted ? 'Trip Completed' : 'Mark as Completed'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-[#e8e4d6] bg-[#fafaf5] hover:shadow-sm transition">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#2d5840] text-white flex items-center justify-center font-bold">
          {index + 1}
        </div>
        <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">{activity.time}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="font-semibold text-[#1f3d2b]">{activity.name}</h4>
          {activity.category && (
            <Badge className="bg-[#e8efe6] text-[#1f3d2b] hover:bg-[#e8efe6] shrink-0">{activity.category}</Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          {activity.location?.address && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {activity.location.address}
            </span>
          )}
          {activity.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activity.duration}
            </span>
          )}
          {activity.estimatedCost !== undefined && (
            <span className="text-[#2d5840] font-semibold">₱{activity.estimatedCost.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}