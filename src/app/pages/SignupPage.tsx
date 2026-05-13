import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { X, Plane } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signup(email, password, name || email.split('@')[0]);
      if (result.ok) {
        toast.success('Account created! Check your email to confirm.');
        navigate('/dashboard');
      } else {
        toast.error(result.error ?? 'Signup failed');
      }
    } catch {
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1310] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <Plane className="w-7 h-7 text-[#2d5840] mb-1" />
          <span className="font-bold text-2xl text-[#2d5840]" style={{ fontFamily: 'Georgia, serif' }}>
            PhiliFinds
          </span>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Welcome to PhiliFinds</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-sm text-gray-700">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="mt-1 rounded-full px-4 py-5 border-gray-200"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 rounded-full px-4 py-5 border-gray-200"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 rounded-full px-4 py-5 border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">Use 8 or more letters, numbers and symbols</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-white font-medium shadow-md transition disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #5fa476 0%, #2d5840 100%)' }}
          >
            {loading ? 'Creating account...' : 'Continue'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" /> OR <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button className="w-full py-3 rounded-full border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.86 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.36-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.68-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38z"/></svg>
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2d5840] font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
