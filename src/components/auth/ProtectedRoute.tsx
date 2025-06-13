import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // Se o usuário está autenticado mas não tem um bolão, redireciona para a página de entrada/criação
  if (!user.pool_id && !window.location.pathname.includes('/join-pool') && !window.location.pathname.includes('/create-pool')) {
    return <Navigate to="/join-pool" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;