// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Pool } from '@/types/matches';

// O AppUser não tem mais pool_id
export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  payment_status?: 'paid' | 'pending';
};

// Nova interface para a participação, incluindo o bolão completo
export interface Participation {
  pool: Pool;
  points: number;
}

interface AuthContextType {
  user: AppUser | null;
  activePool: Pool | null; // O bolão que o usuário está vendo no momento
  userParticipations: Participation[]; // Lista de todas as participações do usuário
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  switchPool: (poolId: string) => void; // Função para trocar de bolão
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
  fetchAndSyncProfile: (sessionUser: User) => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [userParticipations, setUserParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin ?? false;
  const isOwner = !!user && !!activePool && user.id === activePool.owner_id;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActivePool(null);
    setUserParticipations([]);
    localStorage.removeItem('activePoolId');
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      const { data: profile, error } = await supabase.from('users_custom').select('*').eq('id', sessionUser.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select('points, pools!inner(*)') // Usando !inner para garantir que o bolão exista
        .eq('user_id', sessionUser.id);
        
      if (participationsError) throw participationsError;
      
      const participations = (participationsData || []).map(p => ({
        points: p.points,
        pool: p.pools as Pool
      }));

      setUserParticipations(participations);
      
      if (participations.length > 0) {
        const lastActivePoolId = localStorage.getItem('activePoolId');
        const lastActivePool = participations.find(p => p.pool.id === lastActivePoolId)?.pool;
        setActivePool(lastActivePool || participations[0].pool);
      } else {
        setActivePool(null);
      }
      
      return combinedUser;
    } catch (error: any) {
      console.error("Erro ao buscar perfil/bolões:", error);
      await signOut();
      return null;
    }
  }, [signOut]);
  
  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndSyncProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const sessionUser = session?.user;
        if (sessionUser) {
            fetchAndSyncProfile(sessionUser);
        } else {
            setUser(null);
            setActivePool(null);
            setUserParticipations([]);
        }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [fetchAndSyncProfile]);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) { toast.error("Erro ao atualizar perfil."); throw error; };
    await fetchAndSyncProfile(user);
  };

  const switchPool = (poolId: string) => {
      const participation = userParticipations.find(p => p.pool.id === poolId);
      if (participation) {
          setActivePool(participation.pool);
          localStorage.setItem('activePoolId', poolId);
      }
  };
  
  const value = { user, activePool, userParticipations, loading, isAuthenticated, isOwner, isAdmin, login, signOut, updateUserProfile, fetchAndSyncProfile, switchPool };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};