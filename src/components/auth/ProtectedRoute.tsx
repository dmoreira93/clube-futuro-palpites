import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CircleNotch } from '@phosphor-icons/react';

// 1. Componente Loading movido para cá
const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <CircleNotch size={32} className="text-white animate-spin" />
    </div>
  );
};

// 2. Props e componente principal sem alterações na lógica
interface ProtectedRouteProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading, isAdmin, userParticipations } = useAuth();

  if (loading) {
    // Usando o componente Loading definido acima
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