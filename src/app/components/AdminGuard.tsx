import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AdminGuard() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
