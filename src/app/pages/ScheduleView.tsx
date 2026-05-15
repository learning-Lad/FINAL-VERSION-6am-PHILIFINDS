import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useTrip, type Activity, type TripPlan, type DailySchedule } from '../context/TripContext';
import { supabase } from '../lib/supabase';
import {
  Plane,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Truck,
  X,
} from 'lucide-react';
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

function ActivityCard({
  activity,
  index,
  isCompleted,
  onToggle,
}: {
  activity: Activity;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const isTransit =
    activity.category?.toLowerCase().includes('transit') ||
    activity.category?.toLowerCase().includes('taxi');

  return (
    <div
      className={`flex gap-4 p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : isTransit
          ? 'border-blue-200 bg-blue-50/50 hover:shadow-sm'
          : 'border-[#e8e4d6] bg-[#fafaf5] hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
            isCompleted ? 'bg-gray-400' : isTransit ? 'bg-blue-600' : 'bg-[#2d5840]'
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : isTransit ? (
            <Truck className="w-5 h-5" />
          ) : (
            index + 1
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">{activity.time}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className={`font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-[#1f3d2b]'}`}>
            {activity.name}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                ✓ Done
              </span>
            )}
            {activity.category && !isCompleted && (
              <Badge
                className={`${
                  isTransit
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-[#e8efe6] text-[#1f3d2b] hover:bg-[#e8efe6]'
                }`}
              >
                {activity.category}
              </Badge>
            )}
          </div>
        </div>
        <p className={`text-sm mb-3 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
          {activity.description}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
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
              <span className={`font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-[#2d5840]'}`}>
                ₱{activity.estimatedCost.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isCompleted
                ? 'border-gray-300 text-gray-500 bg-white hover:bg-gray-100'
                : isTransit
                ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                : 'border-[#2d5840] text-[#2d5840] bg-[#e8efe6] hover:bg-[#d4e8df]'
            }`}
          >
            {isCompleted ? (
              <><X className="w-3.5 h-3.5" /> Undo</>
            ) : (
              <><CheckCircle className="w-3.5 h-3.5" /> Mark as Done</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScheduleView() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, toggleTripCompletion } = useTrip();
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Activity completion state ───────────────────────────────────────────
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [confirmActivity, setConfirmActivity] = useState<Activity | null>(null);

  const handleConfirmComplete = () => {
    if (!confirmActivity) return;
    setCompletedIds((prev) => new Set([...prev, confirmActivity.id]));
    setConfirmActivity(null);
  };

  const handleToggleComplete = (activity: Activity) => {
    if (completedIds.has(activity.id)) {
      // Undo — remove from completed immediately, no modal needed
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(activity.id);
        return next;
      });
    } else {
      // Mark done — show confirmation modal
      setConfirmActivity(activity);
    }
  };

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
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (!active) return;
      if (error || !data) {
        navigate('/dashboard');
        return;
      }
      setTrip(fromRow(data));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [tripId, trips, navigate]);

  // Scroll selected day button into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const buttons = scrollContainerRef.current.querySelectorAll('button');
      if (buttons[selectedDay - 1]) {
        buttons[selectedDay - 1].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedDay]);

  const itinerary: DailySchedule[] | undefined = trip?.itinerary;

  // ── Shared visibility helper ────────────────────────────────────────────
  // Returns true if an activity should be shown given the current time.
  // - Completed activities are always hidden.
  // - On past days: all hidden.
  // - On today: only activities at or after the current time are shown.
  // - On future days: all shown.
  const isActivityVisible = useCallback(
    (activity: Activity, dayData: DailySchedule): boolean => {
      if (!trip) return false;
      if (completedIds.has(activity.id)) return false;

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const dayDate = dayData.date
        ? new Date(`${dayData.date}T12:00:00`)
        : (() => {
            const d = new Date(trip.startDate ?? trip.createdAt);
            d.setDate(d.getDate() + (dayData.day - 1));
            return d;
          })();

      const dayMidnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      const isPast  = dayMidnight.getTime() < todayMidnight.getTime();
      const isToday = dayMidnight.getTime() === todayMidnight.getTime();

      if (isPast) return false;
      if (!isToday) return true; // future day — show everything

      // Today: only show activities at or after the current time
      if (!activity.time) return true;
      const match = activity.time.match(/(\d+):(\d+)/);
      if (!match) return true;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const t = activity.time.toLowerCase();
      if (t.includes('pm') && h < 12) h += 12;
      if (t.includes('am') && h === 12) h = 0;
      return h > now.getHours() || (h === now.getHours() && m >= now.getMinutes());
    },
    [trip, completedIds]
  );

  // Map markers: only visible activities for the currently selected day
  const allMarkers = useMemo(() => {
    if (!itinerary) return [];
    const selectedDayData = itinerary.find((d) => d.day === selectedDay);
    if (!selectedDayData) return [];
    return selectedDayData.activities.filter((a) => isActivityVisible(a, selectedDayData));
  }, [itinerary, selectedDay, isActivityVisible]);

  const center = useMemo(() => {
    if (allMarkers.length === 0) return [12.8797, 121.774] as [number, number];
    const lat =
      allMarkers.reduce((s, a) => s + (a.location?.lat || 0), 0) / allMarkers.length;
    const lng =
      allMarkers.reduce((s, a) => s + (a.location?.lng || 0), 0) / allMarkers.length;
    return [lat, lng] as [number, number];
  }, [allMarkers]);

  const getFormattedDate = (dayNum: number): string => {
    if (!trip) return '';

    const dayData = itinerary?.find((d) => d.day === dayNum);
    if (dayData?.date) {
      const date = new Date(`${dayData.date}T00:00:00`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const base = new Date(trip.startDate ?? trip.createdAt);
    base.setDate(base.getDate() + (dayNum - 1));
    return base.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePrevDay = () => {
    if (selectedDay > 1) setSelectedDay(selectedDay - 1);
  };

  const handleNextDay = () => {
    if (itinerary && selectedDay < itinerary.length) setSelectedDay(selectedDay + 1);
  };

  const activitiesCost = useMemo(() => {
    if (!itinerary || !trip) return 0;
    return itinerary.reduce((total, day) =>
      total + day.activities.reduce((s, a) =>
        isActivityVisible(a, day) ? s + (a.estimatedCost ?? 0) : s
      , 0)
    , 0);
  }, [itinerary, trip, isActivityVisible]);

  const transportFee = trip?.estimatedTransportFee ?? 0;
  const totalCost = activitiesCost + transportFee;

  const currentDay = itinerary?.find((d) => d.day === selectedDay);

  const displayedActivities = useMemo(() => {
    if (!currentDay || !trip) return [];
    // Show ALL activities for the selected day (completed ones stay, just styled differently)
    // Apply time filter for today but keep completed ones visible too
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let activityDate: Date;
    if (currentDay.date) {
      activityDate = new Date(`${currentDay.date}T12:00:00`);
    } else {
      activityDate = new Date(trip.startDate ?? trip.createdAt);
      activityDate.setDate(activityDate.getDate() + (currentDay.day - 1));
    }
    const dayMidnight = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    const isToday = dayMidnight.getTime() === todayMidnight.getTime();
    const isPast  = dayMidnight.getTime() < todayMidnight.getTime();

    return currentDay.activities
      .map((activity, index) => ({ activity, index }))
      .filter(({ activity }) => {
        // Always show completed activities (so user can undo)
        if (completedIds.has(activity.id)) return true;
        // Hide past days' non-completed activities
        if (isPast) return false;
        // For today, hide activities whose time has passed (unless completed)
        if (isToday && activity.time) {
          const match = activity.time.match(/(\d+):(\d+)/);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const t = activity.time.toLowerCase();
            if (t.includes('pm') && h < 12) h += 12;
            if (t.includes('am') && h === 12) h = 0;
            if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) return false;
          }
        }
        return true;
      });
  }, [currentDay, trip, completedIds]);

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

  const firstDayDate = itinerary[0]?.date
    ? new Date(`${itinerary[0].date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const lastDayDate =
    itinerary.length > 1 && itinerary[itinerary.length - 1]?.date
      ? new Date(
          `${itinerary[itinerary.length - 1].date}T00:00:00`
        ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;
  const dateRangeLabel =
    firstDayDate && lastDayDate
      ? `${firstDayDate} – ${lastDayDate}`
      : firstDayDate ?? '';

  return (
    <>
      <div className="min-h-screen bg-[#f6f5ef]">
        {/* Header */}
        <header className="px-8 py-5 flex items-center justify-between bg-white/70 backdrop-blur border-b border-[#e8e4d6]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[#2d5840] hover:underline flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-2 text-[#2d5840]">
              <Plane className="w-6 h-6" />
              <span className="font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>
                PhiliFinds
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-[#1f3d2b]">
              {trip.origin ? `${trip.origin} ✈️ ${trip.destination}` : trip.destination}
            </div>
            <div className="text-xs text-gray-500">
              {trip.duration} days • {trip.groupSize}{' '}
              {trip.groupSize === 1 ? 'person' : 'people'} •{' '}
              <span className="capitalize">{trip.budget}</span>
            </div>
            {dateRangeLabel && (
              <div className="text-xs text-[#5fa476] font-medium mt-0.5">{dateRangeLabel}</div>
            )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-8 py-10">
          <p className="text-[#2d5840] italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Your nimnim itinerary
          </p>
          <h1
            className="text-4xl font-bold text-[#1f3d2b] mb-1"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {trip.destination} Trip
          </h1>
          {dateRangeLabel && (
            <p className="text-gray-500 text-sm mb-6">{dateRangeLabel}</p>
          )}

          {/* Map */}
          <Card className="mb-6 overflow-hidden border-0 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-0">
              <div className="h-[420px]">
                <MapContainer
                  center={center}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {allMarkers.map((a) => (
                    <Marker
                      key={a.id}
                      position={[a.location?.lat || center[0], a.location?.lng || center[1]]}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold text-[#1f3d2b]">{a.name}</div>
                          <div className="text-gray-600">{a.description}</div>
                          <div className="text-xs text-gray-500 mt-1">{a.location?.address}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Day Slider */}
          <Card className="mb-6 border-0 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevDay}
                  disabled={selectedDay === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 text-[#2d5840]" />
                </button>

                <div
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-x-auto pb-2 flex-1 scroll-smooth"
                  style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                >
                  {itinerary.map((day) => {
                    const label = getFormattedDate(day.day);
                    return (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={`px-4 py-3 rounded-full whitespace-nowrap font-medium transition flex-shrink-0 ${
                          selectedDay === day.day
                            ? 'bg-[#2d5840] text-white shadow-lg'
                            : 'bg-white text-[#1f3d2b] border border-gray-200 hover:border-[#5fa476]'
                        }`}
                      >
                        <div className="text-sm font-semibold">Day {day.day}</div>
                        <div
                          className={`text-xs ${
                            selectedDay === day.day ? 'text-gray-100' : 'text-gray-600'
                          }`}
                        >
                          {label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextDay}
                  disabled={selectedDay === itinerary.length}
                  className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <ChevronRight className="w-5 h-5 text-[#2d5840]" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2d5840] transition-all"
                    style={{ width: `${(selectedDay / itinerary.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {selectedDay} / {itinerary.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Daily Schedule */}
          {currentDay && (
            <Card className="border-0 shadow-sm rounded-2xl bg-white mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-2xl font-bold text-[#1f3d2b]"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Day {currentDay.day} · {getFormattedDate(currentDay.day)}
                  </h2>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Remaining Cost Today</p>
                    <p className="text-xl font-bold text-[#2d5840]">
                      ₱
                      {displayedActivities
                        .reduce((s, { activity }) => s + (activity.estimatedCost ?? 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {displayedActivities.length > 0 ? (
                    displayedActivities.map(({ activity, index }) => (
                      <ActivityCard
                        key={activity.id ?? `${currentDay.day}-${index}`}
                        activity={activity}
                        index={index}
                        isCompleted={completedIds.has(activity.id)}
                        onToggle={() => handleToggleComplete(activity)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 border border-gray-100 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-[#5fa476] mx-auto mb-2 opacity-50" />
                      No remaining activities for today. Time to relax!
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t flex justify-between items-center">
                  <span className="font-semibold text-[#1f3d2b]">Total for Remaining:</span>
                  <span className="text-xl font-bold text-[#2d5840]">
                    ₱
                    {displayedActivities
                      .reduce((s, { activity }) => s + (activity.estimatedCost ?? 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trip Summary with Cost Breakdown */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white mb-6">
            <CardContent className="p-6">
              <h3
                className="text-2xl font-bold text-[#1f3d2b] mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Overall Trip Cost Breakdown
              </h3>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Transport & Local Fare */}
                <div className="bg-gradient-to-br from-[#e8efe6] to-[#d4e8df] rounded-xl p-5 border border-[#5fa476]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-[#2d5840]" />
                    <span className="text-sm font-semibold text-gray-600">
                      Transport &amp; Local Fare
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-[#2d5840]">
                    ₱{transportFee.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {trip.origin
                      ? `${trip.origin} ⇌ ${trip.destination}`
                      : `Round-trip to ${trip.destination}`}
                    <br />
                    Includes flights/ferries + local commutes ({trip.groupSize}{' '}
                    {trip.groupSize === 1 ? 'person' : 'people'})
                  </p>
                </div>

                {/* Activities Cost */}
                <div className="bg-gradient-to-br from-[#fef2f2] to-[#ffe8e8] rounded-xl p-5 border border-[#f0a3a3]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-[#e63946]" />
                    <span className="text-sm font-semibold text-gray-600">
                      Remaining Activities &amp; Meals
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-[#e63946]">
                    ₱{activitiesCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {trip.duration} {trip.duration === 1 ? 'day' : 'days'} of experiences
                    {completedIds.size > 0 && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-[#2d5840] font-semibold">
                        · {completedIds.size} activity{completedIds.size > 1 ? ' activities' : ''} completed ✓
                      </span>
                    )}
                    {dateRangeLabel && (
                      <>
                        <br />
                        <span className="text-[#5fa476]">{dateRangeLabel}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Total Cost */}
                <div className="bg-gradient-to-br from-[#5fa476] to-[#2d5840] rounded-xl p-5 border border-[#2d5840]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-white/90">Total Budget</span>
                  </div>
                  <p className="text-3xl font-bold text-white">₱{totalCost.toLocaleString()}</p>
                  <p className="text-xs text-white/75 mt-2">
                    {trip.duration} {trip.duration === 1 ? 'day' : 'days'} •{' '}
                    {trip.groupSize} {trip.groupSize === 1 ? 'traveler' : 'travelers'}
                  </p>
                </div>
              </div>

              {/* Cost Summary Table */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      Transportation &amp; Local Fares ({trip.groupSize}{' '}
                      {trip.groupSize === 1 ? 'person' : 'people'})
                    </span>
                    <span className="font-semibold text-[#2d5840]">
                      ₱{transportFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 -mt-1 pl-0">
                    {trip.origin && trip.origin !== trip.destination
                      ? `Includes intercity travel (${trip.origin} ⇌ ${trip.destination}) + local commutes`
                      : `Local commutes within ${trip.destination}`}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      Remaining Activities &amp; Dining ({trip.duration}{' '}
                      {trip.duration === 1 ? 'day' : 'days'})
                    </span>
                    <span className="font-semibold text-[#2d5840]">
                      ₱{activitiesCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-px bg-gray-300 my-2" />
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-[#1f3d2b]">Total Estimated Cost</span>
                    <span className="font-bold text-[#2d5840]">₱{totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> These are estimates based on typical prices. Actual costs may
                vary. Remember to budget for souvenirs and extras!
              </p>
            </CardContent>
          </Card>

          {/* Activity Preferences */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white mb-6">
            <CardContent className="p-6">
              <h4 className="text-sm text-gray-500 mb-3 font-semibold">Activity Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {trip.activities.map((a) => (
                  <Badge key={a} className="bg-[#e8efe6] text-[#1f3d2b] hover:bg-[#e8efe6]">
                    {a}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trip Status */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h4 className="text-sm text-gray-500 mb-2">Trip Status</h4>
                <p
                  className={`text-lg font-semibold ${
                    trip.isCompleted ? 'text-green-600' : 'text-[#2d5840]'
                  }`}
                >
                  {trip.isCompleted ? '✓ Trip Completed' : 'Ongoing'}
                </p>
              </div>

              <button
                onClick={async () => {
                  if (!toggleTripCompletion) return;
                  try {
                    await toggleTripCompletion(trip.id, !trip.isCompleted);
                    setTrip({ ...trip, isCompleted: !trip.isCompleted });
                  } catch (e) {
                    console.error('Failed to update status', e);
                  }
                }}
                className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 font-medium transition-all duration-300 w-full md:w-auto ${
                  trip.isCompleted
                    ? 'bg-[#e8efe6] text-[#2d5840] border border-[#2d5840] hover:bg-[#d8e6d5]'
                    : 'bg-gradient-to-r from-[#5fa476] to-[#2d5840] text-white hover:opacity-90 shadow-md'
                }`}
              >
                <CheckCircle
                  className={`w-5 h-5 ${trip.isCompleted ? 'text-[#2d5840]' : 'text-white'}`}
                />
                {trip.isCompleted ? 'Trip Completed' : 'Mark as Completed'}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirmation modal ────────────────────────────────────────────── */}
      {confirmActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setConfirmActivity(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#e8efe6] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-[#2d5840]" />
            </div>
            <h3
              className="text-lg font-bold text-[#1f3d2b] text-center mb-1"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Mark as Done?
            </h3>
            <p className="text-sm text-gray-600 text-center font-semibold mb-1">
              {confirmActivity.name}
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              This activity will be removed from your list and its cost deducted from your totals.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmActivity(null)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleConfirmComplete}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-medium shadow transition flex items-center justify-center gap-1.5"
                style={{ background: 'linear-gradient(90deg,#5fa476 0%,#2d5840 100%)' }}
              >
                <CheckCircle className="w-4 h-4" /> Mark Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}