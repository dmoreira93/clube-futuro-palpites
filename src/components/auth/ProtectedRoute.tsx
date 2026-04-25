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
    // A adição do "replace" impede acumulo no histórico do navegador 
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}