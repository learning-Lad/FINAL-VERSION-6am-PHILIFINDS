import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useTrip } from '../context/TripContext';
import { toast } from 'sonner';
import { Plane, MapPin, Users, Wallet, Calendar, Sparkles, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PHILIPPINE_CITIES = [
  'Manila', 'Cebu', 'Boracay', 'Palawan', 'Baguio', 'Davao', 'Siargao',
  'Vigan', 'Bohol', 'Batangas', 'Iloilo', 'Dumaguete', 'Tagaytay'
];

const BUDGET_OPTIONS = [
  { value: 'budget',    label: 'Budget-friendly', description: '₱1,000 – ₱3,000/day' },
  { value: 'mid-range', label: 'Mid-range',       description: '₱3,000 – ₱7,000/day' },
  { value: 'luxury',    label: 'Luxury',          description: '₱7,000+/day' },
];

const ACTIVITY_TYPES = [
  'Tourist Spots', 'Relaxation', 'Adventure', 'Foodie', 'Culture',
  'Beach', 'Hiking', 'Shopping', 'Nightlife', 'Photography'
];

const LOADING_LINES = [
  'nimnim is exploring your destination…',
  'Curating local hidden gems…',
  'Calculating costs and routes…',
  'Building your day-by-day schedule…',
  'Adding finishing touches…',
];

function Section({ icon: Icon, title, description, children }: {
  icon: any; title: string; description: string; children: React.ReactNode
}) {
  return (
    <Card className="border-0 shadow-sm rounded-2xl bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-1 text-[#1f3d2b]">
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function CalendarPicker({ startDate, endDate, onStartChange, onEndChange }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (day: number) => {
    if (isPastDate(day)) {
      toast.error('Please select a future date');
      return;
    }

    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!selectingEnd) {
      onStartChange(newDate);
      if (endDate && newDate > endDate) {
        onEndChange(null);
      }
      setSelectingEnd(true);
    } else {
      if (newDate < startDate) {
        onEndChange(startDate);
        onStartChange(newDate);
        setSelectingEnd(true);
      } else {
        onEndChange(newDate);
        setSelectingEnd(false);
        setShowPicker(false);
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateInRange = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateStartOrEnd = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (startDate && date.toDateString() === startDate.toDateString()) ||
           (endDate && date.toDateString() === endDate.toDateString());
  };

  const formatDateDisplay = (date: Date) => {
    if (!date) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysArray = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-600 font-medium block mb-2">Start Date</label>
          <button
            type="button"
            onClick={() => {
              setShowPicker(!showPicker);
              setSelectingEnd(false);
            }}
            className="w-full px-4 py-3 rounded-full border border-gray-200 text-left text-sm hover:border-[#5fa476] transition"
          >
            {startDate ? formatDateDisplay(startDate) : 'Select start date'}
          </button>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-600 font-medium block mb-2">End Date</label>
          <button
            type="button"
            onClick={() => {
              setShowPicker(true);
              setSelectingEnd(true);
            }}
            className="w-full px-4 py-3 rounded-full border border-gray-200 text-left text-sm hover:border-[#5fa476] transition"
          >
            {endDate ? formatDateDisplay(endDate) : 'Select end date'}
          </button>
        </div>
      </div>

      {showPicker && (
        <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4 text-[#2d5840]" />
            </button>
            <h4 className="font-semibold text-[#1f3d2b]" style={{ fontFamily: 'Georgia, serif' }}>
              {monthName}
            </h4>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4 text-[#2d5840]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => day && handleDateClick(day)}
                disabled={!day || (day && isPastDate(day))}
                className={`aspect-square rounded-lg text-sm font-medium transition ${
                  !day
                    ? 'text-transparent'
                    : day && isPastDate(day)
                    ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                    : isDateStartOrEnd(day)
                    ? 'bg-[#2d5840] text-white shadow-md'
                    : isDateInRange(day)
                    ? 'bg-[#d4e8df] text-[#1f3d2b]'
                    : 'text-[#1f3d2b] hover:bg-gray-200 cursor-pointer'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {selectingEnd ? 'Select end date' : 'Select start date'}
            </p>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-xs text-[#2d5840] hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {startDate && endDate && (
        <div className="bg-[#e8efe6] border border-[#5fa476]/30 rounded-xl p-3">
          <p className="text-sm text-[#1f3d2b] font-medium">
            {calculateDuration()} {calculateDuration() === 1 ? 'day' : 'days'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
          </p>
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDateAtMidnight = new Date(startDate);
            startDateAtMidnight.setHours(0, 0, 0, 0);
            const isSameDay = startDateAtMidnight.getTime() === today.getTime();
            
            if (isSameDay) {
              const currentHour = new Date().getHours();
              const currentMinute = new Date().getMinutes();
              const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
              return (
                <p className="text-xs text-[#2d5840] mt-2 bg-white/50 rounded px-2 py-1">
                  ⏰ Trip starts today - schedules will only show activities from {timeStr} onwards
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}

function GeneratingScreen({ origin, destination }: { origin: string, destination: string }) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((i) => (i + 1) % LOADING_LINES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f5ef] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[#2d5840] flex items-center justify-center mb-8 shadow-lg">
        <Sparkles className="w-9 h-9 text-white animate-pulse" />
      </div>
      <p className="text-[#2d5840] italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>Powered by nimnim AI</p>
      <h1 className="text-3xl font-bold text-[#1f3d2b] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
        Crafting your trip from {origin} to {destination}
      </h1>
      <p className="text-gray-500 text-sm mb-8 h-5 transition-all duration-500">
        {LOADING_LINES[lineIndex]}
      </p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#2d5840]"
            style={{ animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function TravelPlannerSetup() {
  const navigate = useNavigate();
  const { createTrip, generateItinerary } = useTrip();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState<'budget' | 'mid-range' | 'luxury'>('mid-range');
  const [groupSize, setGroupSize] = useState(2);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const toggleActivity = (a: string) =>
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin) return toast.error('Please select a starting city');
    if (!destination) return toast.error('Please select a destination');
    if (!startDate || !endDate) return toast.error('Please select trip dates');
    if (activities.length === 0) return toast.error('Please select at least one activity type');

    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check if start date is today and calculate remaining hours
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateAtMidnight = new Date(startDate);
    startDateAtMidnight.setHours(0, 0, 0, 0);
    
    const isSameDay = startDateAtMidnight.getTime() === today.getTime();
    const currentTime = isSameDay ? new Date() : null;

    setSubmitting(true);
    let tripId: string;
    try {
      tripId = await createTrip({
        origin,
        destination,
        budget,
        groupSize,
        duration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        activities,
        currentTime: currentTime ? currentTime.toISOString() : null, 
        isSameDay 
      });
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create trip');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setGenerating(true);
    try {
      await generateItinerary(tripId);
      navigate(`/planner/schedule/${tripId}`);
    } catch (err: any) {
      setGenerating(false);
      toast.error(err.message ?? 'nimnim failed to generate an itinerary. Please try again.');
    }
  };

  if (generating) return <GeneratingScreen origin={origin} destination={destination} />;

  return (
    <div className="min-h-screen bg-[#f6f5ef]">
      <header className="px-8 py-5 flex items-center justify-between bg-white/70 backdrop-blur border-b border-[#e8e4d6]">
        <div className="flex items-center gap-2 text-[#2d5840]">
          <Plane className="w-6 h-6" />
          <span className="font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>PhiliFinds</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-[#2d5840] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <p className="text-[#2d5840] italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Let's craft your journey
        </p>
        <h1 className="text-4xl font-bold text-[#1f3d2b] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Plan Your Trip
        </h1>
        <p className="text-gray-600 mb-8">
          Tell nimnim about your ideal Philippine adventure and it will build your full itinerary.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid md:grid-cols-2 gap-5">
            {/* Origin */}
            <Section icon={MapPin} title="From" description="Where are you starting?">
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="rounded-full border-gray-200">
                  <SelectValue placeholder="Select origin city" />
                </SelectTrigger>
                <SelectContent>
                  {PHILIPPINE_CITIES.map((c) => (
                    <SelectItem key={`from-${c}`} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            {/* Destination */}
            <Section icon={MapPin} title="To" description="Where would you like to explore?">
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="rounded-full border-gray-200">
                  <SelectValue placeholder="Select destination city" />
                </SelectTrigger>
                <SelectContent>
                  {PHILIPPINE_CITIES.map((c) => (
                    <SelectItem key={`to-${c}`} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>
          </div>

          {/* Budget */}
          <Section icon={Wallet} title="Budget" description="What's your budget per day?">
            <div className="grid gap-3">
              {BUDGET_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setBudget(o.value as any)}
                  className={`p-4 rounded-xl border text-left transition ${
                    budget === o.value
                      ? 'border-[#2d5840] bg-[#e8efe6]'
                      : 'border-gray-200 hover:border-[#5fa476]/50'
                  }`}
                >
                  <div className="font-semibold text-[#1f3d2b]">{o.label}</div>
                  <div className="text-sm text-gray-600">{o.description}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* Group size + Trip Dates */}
          <div className="grid md:grid-cols-2 gap-5">
            <Section icon={Users} title="Group Size" description="How many people?">
              <Input
                type="number" min={1} max={20}
                value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))}
                className="rounded-full border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-2">
                {groupSize === 1 ? 'Solo traveler' : `${groupSize} travelers`}
              </p>
            </Section>

            <Section icon={Calendar} title="Trip Dates" description="When would you like to travel?">
              <CalendarPicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
              />
            </Section>
          </div>

          {/* Activity preferences */}
          <Section
            icon={Sparkles}
            title="Activity Preferences"
            description="What would you like to do? nimnim will tailor the itinerary to these."
          >
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((a) => {
                const active = activities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleActivity(a)}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                      active
                        ? 'bg-[#2d5840] text-white border-[#2d5840]'
                        : 'bg-white text-[#1f3d2b] border-gray-200 hover:border-[#5fa476]'
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            {activities.length > 0 && (
              <p className="text-xs text-[#2d5840] mt-3">
                {activities.length} preference{activities.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </Section>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-full text-white font-medium shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Sparkles className="w-4 h-4" /> Generate Itinerary with nimnim</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}