import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { useTrip } from '../context/TripContext';
import { Plane, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../components/Pic/ImageWithFallback';

const EXPERIENCES = [
  { id: 'culture',   name: 'Heritage & Culture', category: 'Culture',       image: 'https://images.unsplash.com/photo-1581474812906-f43356bd6c65?w=600', duration: '2-3 hours', description: 'Historic landmarks, museums, and local heritage sites' },
  { id: 'beach',     name: 'Beach Day',          category: 'Beach',         image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',     duration: '4-6 hours', description: 'White-sand beaches and seaside relaxation' },
  { id: 'food',      name: 'Local Food Crawl',   category: 'Foodie',        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',  duration: '2-3 hours', description: 'Authentic regional dishes and street food' },
  { id: 'islands',   name: 'Island Hopping',     category: 'Adventure',     image: 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=600',     duration: 'Half day',  description: 'Hidden lagoons, snorkeling, and boat tours' },
  { id: 'sights',    name: 'Top Tourist Spots',  category: 'Tourist Spots', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600',  duration: '2 hours',   description: 'The must-see landmarks every visitor should hit' },
  { id: 'wellness',  name: 'Spa & Wellness',     category: 'Relaxation',    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',  duration: '2-3 hours', description: 'Traditional Filipino massage and wellness retreats' },
  { id: 'nature',    name: 'Nature & Hiking',    category: 'Adventure',     image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',  duration: 'Half day',  description: 'Waterfalls, mountains, and forest trails' },
  { id: 'nightlife', name: 'Nightlife & Bars',   category: 'Foodie',        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',  duration: '3-4 hours', description: 'Local bars, live music, and evening hangouts' },
  { id: 'shopping',  name: 'Markets & Shopping', category: 'Culture',       image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600',     duration: '2-3 hours', description: 'Souvenir markets, malls, and artisan shops' },
];

export function PlacesSelection() {
  const navigate = useNavigate();
  const { currentTrip, generateItinerary } = useTrip();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentTrip) navigate('/planner/setup');
  }, [currentTrip, navigate]);

  if (!currentTrip) return null;

  const categories = ['All', ...Array.from(new Set(EXPERIENCES.map((p) => p.category)))];
  const filtered = selectedCategory === 'All' ? EXPERIENCES : EXPERIENCES.filter((p) => p.category === selectedCategory);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateItinerary(currentTrip.id);
      navigate(`/planner/schedule/${currentTrip.id}`);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to generate itinerary';
      // sonner is already imported indirectly through toast on other pages — fallback alert
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-6xl mx-auto px-8 py-12">
        <p className="text-[#2d5840] italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Curated for you
        </p>
        <h1 className="text-4xl font-bold text-[#1f3d2b] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Explore {currentTrip.destination}
        </h1>
        <p className="text-gray-600 mb-8">
          {currentTrip.duration} days • {currentTrip.groupSize} {currentTrip.groupSize === 1 ? 'person' : 'people'} • <span className="capitalize">{currentTrip.budget}</span> budget
        </p>

        {/* Category chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = selectedCategory === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  active
                    ? 'bg-[#2d5840] text-white border-[#2d5840]'
                    : 'bg-white text-[#1f3d2b] border-gray-200 hover:border-[#5fa476]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Places grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {filtered.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <Card
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`cursor-pointer overflow-hidden border-0 shadow-sm rounded-2xl bg-white transition hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-[#2d5840]' : ''
                }`}
              >
                <div className="h-44 overflow-hidden relative">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-white/90 text-[#1f3d2b] text-xs px-3 py-1 rounded-full">
                    {p.category}
                  </span>
                  {isSelected && (
                    <span className="absolute top-3 right-3 bg-[#2d5840] text-white text-xs px-2 py-1 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg text-[#1f3d2b] mb-1">{p.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" /> {p.duration}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer CTA bar */}
        <div className="sticky bottom-6">
          <div className="max-w-2xl mx-auto bg-white rounded-full shadow-lg border border-[#e8e4d6] flex items-center justify-between px-5 py-2">
            <div className="text-sm text-gray-600">
              {selected.length === 0 ? 'Pick the places you love — or skip and let nimnim choose.' : `${selected.length} place${selected.length === 1 ? '' : 's'} selected`}
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2 rounded-full text-white text-sm font-medium shadow-md transition flex items-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Generating…' : 'Generate Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
