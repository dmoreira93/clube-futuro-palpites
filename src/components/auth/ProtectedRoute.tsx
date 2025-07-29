import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// Vamos tentar o caminho relativo direto com a extensão 👇
import Loading from '../Loading.tsx'; 

interface ProtectedRouteProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading, isAdmin, userParticipations } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (user && user.id && userParticipations.length === 0 && !window.location.pathname.includes('/join-pool') && !window.location.pathname.includes('/create-pool')) {
    return <Navigate to="/join-pool" />;
  }

  return children;
}