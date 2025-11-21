import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Componente Loading
const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white"></div>
    </div>
  );
};

interface ProtectedRouteProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // --- REMOVIDO ---
  // O bloco que forçava o redirecionamento para '/join-pool' foi retirado.
  // Agora o usuário novo vai direto para o Dashboard, onde verá as opções de boas-vindas.
  
  return children;
}