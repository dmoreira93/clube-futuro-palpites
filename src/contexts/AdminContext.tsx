// src/contexts/AdminContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Pool {
  id: string;
  name: string;
  championship_id: string;
}

interface AdminContextType {
  managedPoolId: string | null;
  managedPool: Pool | null;
  availablePools: Pool[];
  setManagedPoolId: (poolId: string) => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const [managedPoolId, setManagedPoolIdState] = useState<string | null>(null);
  const [managedPool, setManagedPool] = useState<Pool | null>(null);
  const [availablePools, setAvailablePools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca todos os bolões disponíveis para administração
  useEffect(() => {
    const fetchPools = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pools')
          .select('id, name, championship_id')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAvailablePools(data || []);

        // Se não houver bolão selecionado e há bolões disponíveis, seleciona o primeiro
        if (!managedPoolId && data && data.length > 0) {
          setManagedPoolIdState(data[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar bolões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [isAdmin, managedPoolId]);

  // Atualiza o pool gerenciado quando o ID muda
  useEffect(() => {
    if (managedPoolId) {
      const pool = availablePools.find(p => p.id === managedPoolId);
      setManagedPool(pool || null);
      
      // Salva no localStorage para persistir entre sessões
      localStorage.setItem('admin_managed_pool_id', managedPoolId);
    }
  }, [managedPoolId, availablePools]);

  // Carrega o poolId salvo ao montar
  useEffect(() => {
    const savedPoolId = localStorage.getItem('admin_managed_pool_id');
    if (savedPoolId && availablePools.some(p => p.id === savedPoolId)) {
      setManagedPoolIdState(savedPoolId);
    }
  }, [availablePools]);

  const setManagedPoolId = (poolId: string) => {
    setManagedPoolIdState(poolId);
  };

  return (
    <AdminContext.Provider
      value={{
        managedPoolId,
        managedPool,
        availablePools,
        setManagedPoolId,
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
};
