import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useEmergency } from '../context/EmergencyContext';
// Added CheckCircle to the imports here!
import { Plane, Plus, Calendar, Trash2, Phone, AlertCircle, MapPin, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { trips, deleteTrip } = useTrip();
  const { contacts } = useEmergency();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleDeleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this trip?')) return;
    try {
      await deleteTrip(tripId);
      toast.success('Trip deleted');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete trip');
    }
  };

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: Calendar },
    { label: 'Destinations', value: new Set(trips.map((t) => t.destination)).size, icon: MapPin },
    { label: 'Total Days', value: trips.reduce((s, t) => s + t.duration, 0), icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#f6f5ef]">
      {/* Header */}
      <header className="px-8 py-5 flex justify-between items-center bg-white/70 backdrop-blur border-b border-[#e8e4d6]">
        <div className="flex items-center gap-2 text-[#2d5840]">
          <Plane className="w-6 h-6" />
          <span className="font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>PhiliFinds</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2d5840] text-white flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full text-sm border border-[#2d5840]/30 text-[#2d5840] hover:bg-[#2d5840]/5"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Hero Greeting */}
      <section className="max-w-6xl mx-auto px-8 pt-12 pb-6">
        <p className="text-[#2d5840] italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Welcome back to your journey
        </p>
        <h1 className="text-5xl font-bold text-[#1f3d2b] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
          Hello, {user?.name}.
        </h1>
        <p className="mt-3 text-gray-600 max-w-xl">
          Where will the road take you next? Plan a new adventure or revisit your saved trips below.
        </p>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-8 grid sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#e8efe6] text-[#2d5840] flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#1f3d2b]">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* My Trips */}
      <section className="max-w-6xl mx-auto px-8 mb-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1f3d2b]" style={{ fontFamily: 'Georgia, serif' }}>
            My Trips
          </h2>
          <button
            onClick={() => navigate('/planner/setup')}
            className="px-5 py-2 rounded-full text-white text-sm font-medium shadow-md transition flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
          >
            <Plus className="w-4 h-4" /> Plan a Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm bg-white rounded-2xl">
            <Calendar className="w-14 h-14 mx-auto mb-4 text-[#2d5840]/40" />
            <h3 className="text-xl font-semibold mb-2 text-[#1f3d2b]">No trips yet</h3>
            <p className="text-gray-600 mb-6">Start planning your first Philippine adventure!</p>
            <button
              onClick={() => navigate('/planner/setup')}
              className="px-6 py-3 rounded-full text-white text-sm font-medium shadow-md transition inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
            >
              <Plus className="w-4 h-4" /> Create Your First Trip
            </button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                onClick={() =>
                  trip.itinerary
                    ? navigate(`/planner/schedule/${trip.id}`)
                    : navigate('/planner/places')
                }
                className="cursor-pointer border-0 shadow-sm hover:shadow-lg transition rounded-2xl bg-white overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-[#5fa476] to-[#2d5840]" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg text-[#1f3d2b]">{trip.destination}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </div>
                      
                      {/* NEW COMPLETED BADGE */}
                      {trip.isCompleted && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-[#e8efe6] text-[#2d5840] text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </div>
                      )}
                      
                    </div>
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <Row label="Duration" value={`${trip.duration} days`} />
                    <Row label="Group Size" value={String(trip.groupSize)} />
                    <Row label="Budget" value={trip.budget} capitalize />
                  </div>
                  <div className="pt-4 flex flex-wrap gap-1.5">
                    {trip.activities.slice(0, 3).map((a) => (
                      <span key={a} className="text-[11px] bg-[#e8efe6] text-[#1f3d2b] px-2 py-1 rounded-full">
                        {a}
                      </span>
                    ))}
                    {trip.activities.length > 3 && (
                      <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        +{trip.activities.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Hotlines (read-only) */}
      <section className="max-w-6xl mx-auto px-8 pb-16">
        <div className="mb-5 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-2xl font-bold text-[#1f3d2b]" style={{ fontFamily: 'Georgia, serif' }}>
            Emergency Hotlines
          </h2>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Important Philippine emergency numbers to keep handy during your trip.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <div className="font-semibold text-[#1f3d2b]">{c.name}</div>
                <div className="text-xs text-gray-500 mt-1 mb-3">{c.category}</div>
                <a
                  href={`tel:${c.number.replace(/\s|\(|\)|-/g, '')}`}
                  className="flex items-center gap-2 text-lg font-bold text-[#2d5840]"
                >
                  <Phone className="w-4 h-4" /> {c.number}
                </a>
                {c.description && <p className="text-xs text-gray-600 mt-2">{c.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className={`font-medium text-[#1f3d2b] ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}