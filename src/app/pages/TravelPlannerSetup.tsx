import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useTrip } from '../context/TripContext';
import { toast } from 'sonner';
import { Plane, MapPin, Users, Wallet, Calendar, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

const PHILIPPINE_CITIES = [
  'Manila', 'Cebu', 'Boracay', 'Palawan', 'Baguio', 'Davao', 'Siargao',
  'Vigan', 'Bohol', 'Batangas', 'Iloilo', 'Dumaguete', 'Tagaytay'
];

const BUDGET_OPTIONS = [
  { value: 'budget',    label: 'Budget-friendly', description: '₱1,000 – ₱3,000/day' },
  { value: 'mid-range', label: 'Mid-range',        description: '₱3,000 – ₱7,000/day' },
  { value: 'luxury',    label: 'Luxury',            description: '₱7,000+/day' },
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

function GeneratingScreen({ destination }: { destination: string }) {
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
        Crafting your {destination} trip
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

  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState<'budget' | 'mid-range' | 'luxury'>('mid-range');
  const [groupSize, setGroupSize] = useState(2);
  const [duration, setDuration] = useState(3);
  const [activities, setActivities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const toggleActivity = (a: string) =>
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return toast.error('Please select a destination');
    if (activities.length === 0) return toast.error('Please select at least one activity type');

    setSubmitting(true);
    let tripId: string;
    try {
      tripId = await createTrip({ destination, budget, groupSize, duration, activities });
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

  if (generating) return <GeneratingScreen destination={destination} />;

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
          {/* Destination */}
          <Section icon={MapPin} title="Destination" description="Where would you like to explore?">
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="rounded-full border-gray-200">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {PHILIPPINE_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

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

          {/* Group size + Duration */}
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

            <Section icon={Calendar} title="Duration" description="How many days?">
              <Input
                type="number" min={1} max={30}
                value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="rounded-full border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-2">{duration} {duration === 1 ? 'day' : 'days'}</p>
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
