import { RouterProvider } from 'react-router';
import { router } from './routes';
import { supabaseConfigured } from './lib/supabase';

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#f6f5ef] flex items-center justify-center px-6">
        <div className="max-w-lg bg-white rounded-2xl shadow-sm border border-[#e8e4d6] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1f3d2b] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            
          </h1>
          <p className="text-gray-600 mb-4">
            Create a <code className="px-1.5 py-0.5 bg-gray-100 rounded">.env</code> 
          </p>
          <pre className="text-left text-xs bg-[#1f3d2b] text-[#e8efe6] p-4 rounded-lg overflow-x-auto">
{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
          </pre>
          <p className="text-xs text-gray-500 mt-4">
            Then restart the dev server. See <code>INTEGRATION.md</code> for the full setup.
          </p>
        </div>
      </div>
    );
  }
  return <RouterProvider router={router} />;
}
