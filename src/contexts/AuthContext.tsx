// src/contexts/AuthContext.tsx (VERSÃO ATUALIZADA)

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Pool } from '@/types/matches';

// ALTERADO: Adicionado payment_status ao AppUser
export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  pool_id?: string | null;
  payment_status?: 'paid' | 'pending'; // NOVO CAMPO
};

interface AuthContextType {
  user: AppUser | null;
  pool: Pool | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login' | 'pool_id'>>) => Promise<void>;
  fetchAndSyncProfile: (sessionUser: User) => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  const isFirstLogin = user ? user.first_login === false : false;
  const isAdmin = user?.is_admin ?? false;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPool(null);
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*') // O '*' já inclui o novo campo 'payment_status'
        .eq('id', sessionUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);

      if (combinedUser.pool_id) {
        const { data: poolData, error: poolError } = await supabase
          .from('pools')
          .select('*')
          .eq('id', combinedUser.pool_id)
          .single();

        if (poolError) {
          toast.error("Não foi possível carregar os dados do seu bolão.");
          setPool(null);
        } else {
          setPool(poolData as Pool);
        }
      } else {
        setPool(null);
      }
      
      return combinedUser;

    } catch (error: any) {
      console.error("Erro ao buscar perfil/bolão:", error);
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(async () => {
          setLoading(true);
          const sessionUser = session?.user;
          if (sessionUser) {
            await fetchAndSyncProfile(sessionUser);
          } else {
            setUser(null);
            setPool(null);
          }
          setLoading(false);
        }, 0);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, [fetchAndSyncProfile]);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login' | 'pool_id'>>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) {
        toast.error("Erro ao atualizar perfil.");
        throw error;
    };
    await fetchAndSyncProfile(user);
  };
  
  const value = { user, pool, loading, isAuthenticated, isFirstLogin, isAdmin, login, signOut, updateUserProfile, fetchAndSyncProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};