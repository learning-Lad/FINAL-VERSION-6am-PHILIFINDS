import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import { supabase } from '../lib/supabase';
import { Users, Calendar, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contacts } = useEmergency();

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalTrips, setTotalTrips] = useState<number | null>(null);
  const [activeDestinations, setActiveDestinations] = useState<number | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [usersRes, tripsRes, destRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('destination'),
      ]);

      if (usersRes.count !== null) setTotalUsers(usersRes.count);
      if (tripsRes.count !== null) setTotalTrips(tripsRes.count);
      if (destRes.data) {
        const unique = new Set(destRes.data.map((r) => r.destination));
        setActiveDestinations(unique.size);
      }
    }
    fetchStats();
  }, []);

  const fmt = (n: number | null) => (n === null ? '—' : n);

  const stats = [
    { label: 'Total Users',          value: fmt(totalUsers),         icon: Users,       sub: 'Registered accounts' },
    { label: 'Total Trips',          value: fmt(totalTrips),         icon: Calendar,    sub: 'Trips planned' },
    { label: 'Active Destinations',  value: fmt(activeDestinations), icon: MapPin,      sub: 'Philippine cities' },
    { label: 'Emergency Contacts',   value: contacts.length,         icon: AlertCircle, sub: 'Available hotlines' },
  ];

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getAvatarColor(id: string) {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-violet-100 text-violet-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-cyan-100 text-cyan-700',
    ];
    return colors[id.charCodeAt(0) % colors.length];
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <s.icon className="w-4 h-4" /> {s.label}
              </div>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registered Users */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-sm">Registered Users</h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {registeredUsers.length} {registeredUsers.length === 1 ? 'user' : 'users'}
            </span>
          </div>

          <div className="overflow-y-auto max-h-64 space-y-1 pr-1">
            {registeredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No users found.</p>
            ) : (
              registeredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(u.id)}`}
                    >
                      {getInitials(u.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Travel Trends',      desc: 'Analytics & aggregated travel insights', to: '/admin/trends' },
          { title: 'Emergency Contacts', desc: 'Add, edit, or remove hotlines',          to: '/admin/emergency-contacts' },
        ].map((c) => (
          <Card key={c.to} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(c.to)}>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-1">{c.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{c.desc}</p>
              <Button size="sm" variant="outline" className="gap-2">
                Open <ArrowRight className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}