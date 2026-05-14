import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import { supabase } from '../lib/supabase';
import { Users, Calendar, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contacts } = useEmergency();

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalTrips, setTotalTrips] = useState<number | null>(null);
  const [activeDestinations, setActiveDestinations] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const [usersRes, tripsRes, destRes] = await Promise.all([
  supabase.rpc('get_total_users'),   
  supabase.from('trips').select('*', { count: 'exact', head: true }),
  supabase.from('trips').select('destination'),
]);

if (usersRes.data !== null) setTotalUsers(usersRes.data);  

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
    { label: 'Total Users',          value: fmt(totalUsers),        icon: Users,       sub: 'Registered accounts' },
    { label: 'Total Trips',          value: fmt(totalTrips),        icon: Calendar,    sub: 'Trips planned' },
    { label: 'Active Destinations',  value: fmt(activeDestinations), icon: MapPin,     sub: 'Philippine cities' },
    { label: 'Emergency Contacts',   value: contacts.length,        icon: AlertCircle, sub: 'Available hotlines' },
  ];

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
