// src/components/auth/ProtectedRoute.tsx

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

  // **MUDANÇA PRINCIPAL**: Sempre exibe o loader enquanto o AuthContext estiver carregando.
  // Isso impede qualquer renderização ou redirecionamento prematuro.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" />
      </div>
    );
  }

  // As verificações abaixo só acontecem DEPOIS que o carregamento terminar.
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // Esta verificação agora é segura, pois 'user' é o objeto completo e final.
  if (!user.pool_id && !window.location.pathname.includes('/join-pool') && !window.location.pathname.includes('/create-pool')) {
    return <Navigate to="/join-pool" />;
  }

  // Se tudo estiver certo, renderiza a página solicitada.
  return <>{children}</>;
};

export default ProtectedRoute;