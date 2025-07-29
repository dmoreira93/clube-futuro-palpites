import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// 1. Componente Loading refeito com CSS puro (Tailwind)
//    Sem nenhuma importação de ícones.
const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white"></div>
    </div>
  );
};

// 2. Componente principal, sem alterações.
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