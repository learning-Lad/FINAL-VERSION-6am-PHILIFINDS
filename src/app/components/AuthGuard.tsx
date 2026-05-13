import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
