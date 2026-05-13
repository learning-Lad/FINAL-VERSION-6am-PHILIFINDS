import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, TrendingUp, AlertCircle, Bell, MapPin, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/trends', label: 'Travel Trends', icon: TrendingUp },
  { to: '/admin/emergency-contacts', label: 'Emergency Contacts', icon: AlertCircle },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen flex bg-[#f6f5ef]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1f3d2b] text-white flex flex-col p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <MapPin className="w-7 h-7 text-[#a8d5a8]" />
          <div>
            <div className="font-bold text-lg leading-tight">PhiliFinds</div>
            <div className="text-xs text-white/60">Admin Dashboard</div>
          </div>
        </div>

        <div className="text-[10px] uppercase tracking-wider text-white/50 px-2 mb-2">Main Menu</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-[#2d5840] text-white' : 'text-white/80 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="text-[10px] uppercase tracking-wider text-white/40 px-2 mb-2 mt-6">Super Admin Access</div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#a8d5a8] text-[#1f3d2b] flex items-center justify-center font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="text-sm">
              <div className="font-medium leading-tight">{user?.name ?? 'Admin'} User</div>
              <div className="text-xs text-white/60">{user?.email}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-end gap-4 px-8 py-4 bg-transparent">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search..." className="pl-9 bg-white" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Bell className="w-4 h-4" />
            <div className="text-right">
              <div className="font-medium">{today}</div>
              <div className="text-xs text-gray-500">Philippine Standard Time</div>
            </div>
          </div>
        </header>
        <div className="flex-1 px-8 pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
