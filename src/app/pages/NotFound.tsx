import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { MapPin, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f5ef] to-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <MapPin className="w-20 h-20 text-[#2d5840]" />
        </div>
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Looks like you've wandered off the beaten path. Let's get you back on track!
        </p>
        <Button size="lg" onClick={() => navigate('/')}>
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
