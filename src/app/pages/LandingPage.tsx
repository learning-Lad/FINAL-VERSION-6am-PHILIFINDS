import { useNavigate } from 'react-router';
import { Plane, MapPin, Calendar, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from '../components/Pic/ImageWithFallback';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f5ef]">
      {/* Hero */}
      <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80"
          alt="Beach"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

        <header className="relative z-10 px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Plane className="w-6 h-6" />
            <span className="font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>PhiliFinds</span>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2 rounded-full bg-white/90 text-[#2d5840] font-medium hover:bg-white"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 rounded-full text-white border border-white/40 hover:bg-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-5 py-2 rounded-full bg-white text-[#2d5840] font-medium hover:bg-white/90"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </header>

        <div className="relative z-10 max-w-5xl mx-auto px-8 mt-24 md:mt-32 text-center text-white">
          <h1 className="font-bold leading-tight" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            Take the step.<br />
            The world will meet you there.
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-white/90">
            Discover the Philippines like never before. Tailored journeys for every traveler.
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? '/planner/setup' : '/signup')}
            className="mt-8 px-8 py-3 rounded-full text-white font-medium shadow-lg transition"
            style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
          >
            Start Planning
          </button>
        </div>
      </section>

      {/* Quote bar */}
      <div className="text-center py-10 px-6">
        <p className="italic text-[#2d5840]" style={{ fontFamily: 'Georgia, serif' }}>
          "It begins with stress... but adventures."
        </p>
      </div>

      {/* Feature gallery */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-center font-bold text-3xl mb-12 text-[#1f3d2b]" style={{ fontFamily: 'Georgia, serif' }}>
          It Begins with Stress, But Adventures.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            img="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"
            icon={<MapPin className="w-5 h-5" />}
            title="Smart Destinations"
            description="Curated locations across the Philippines with interactive maps."
          />
          <FeatureCard
            img="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80"
            icon={<Calendar className="w-5 h-5" />}
            title="nimnim"
            description="Your AI travel assistant — personalized day-by-day schedules powered by Groq."
          />
          <FeatureCard
            img="https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=600&q=80"
            icon={<Users className="w-5 h-5" />}
            title="Group Planning"
            description="Perfect for solo travelers, couples, families, and groups."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2d5840] text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-bold text-4xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Your perfect Philippine adventure awaits
          </h2>
          <p className="opacity-90 mb-8">
            Join thousands of travelers discovering hidden gems and popular destinations.
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? '/planner/setup' : '/signup')}
            className="px-8 py-3 rounded-full bg-white text-[#2d5840] font-medium hover:bg-white/90"
          >
            Get Started Free
          </button>
        </div>
      </section>

      <footer className="bg-[#0f1310] text-white/60 py-8 text-center text-sm">
        &copy; 2026 PhiliFinds. Discover the Philippines with confidence.
      </footer>
    </div>
  );
}

function FeatureCard({ img, icon, title, description }: { img: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">
      <div className="aspect-[4/3] overflow-hidden">
        <ImageWithFallback src={img} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-[#2d5840] mb-2">
          {icon}
          <h3 className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
