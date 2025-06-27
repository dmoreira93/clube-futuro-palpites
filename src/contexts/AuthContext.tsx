// src/contexts/AuthContext.tsx (VERSÃO DE RESTAURAÇÃO FINAL)

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Pool } from '@/types/matches';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  pool_id?: string | null;
};

interface AuthContextType {
  user: AppUser | null;
  pool: Pool | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'pool_id'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin ?? false;
  const isOwner = !!user && !!pool && user.id === pool.owner_id;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPool(null);
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase.from('users_custom').select('*').eq('id', sessionUser.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);

      if (combinedUser.pool_id) {
        const { data: poolData, error: poolError } = await supabase.from('pools').select('*').eq('id', combinedUser.pool_id).single();
        if (poolError) {
          toast.error("Não foi possível carregar os dados do seu bolão.");
          setPool(null);
        } else {
          setPool(poolData as Pool);
        }
      } else {
        setPool(null);
      }
    } catch (error: any) {
      console.error("Erro ao buscar perfil/bolão:", error);
      await signOut();
    }
  }, [signOut]);

  useEffect(() => {
    const processSession = async (session: any) => {
      setLoading(true);
      if (session?.user) {
        await fetchAndSyncProfile(session.user);
      }
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => processSession(session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => processSession(session));
    return () => { authListener.subscription.unsubscribe(); };
  }, [fetchAndSyncProfile]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'pool_id'>>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) { toast.error("Erro ao atualizar perfil."); throw error; };
    await fetchAndSyncProfile(user);
  };
  
  const value = { user, pool, loading, isAuthenticated, isOwner, isAdmin, login, signOut, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};