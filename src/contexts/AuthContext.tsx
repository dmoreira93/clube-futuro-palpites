// src/contexts/AuthContext.tsx - VERSÃO CORRIGIDA

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  pool_id?: string | null;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA CORRIGIDA AQUI ---
  // isAuthenticated, isFirstLogin, e isAdmin agora são derivados diretamente do estado 'user'.
  // Isso é mais seguro e evita problemas de sincronia.
  const isAuthenticated = !!user;
  // 'isFirstLogin' é verdadeiro se a coluna 'first_login' no banco for 'false'.
  const isFirstLogin = user ? user.first_login === false : false;
  const isAdmin = user?.is_admin ?? false;
  // --- FIM DA CORREÇÃO ---

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
          if (error.message.includes('JWT') || error.code === 'PGRST301') {
            toast.error("Sua sessão expirou. Por favor, faça login novamente.");
            await signOut();
            return null;
          }
          throw error;
      }
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      return combinedUser;

    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      toast.error("Não foi possível carregar os dados do seu perfil.");
      await signOut();
      return null;
    }
  }, [signOut]);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchAndSyncProfile(session.user);
        }
      } catch (e) {
        console.error("Falha na inicialização do Auth", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchAndSyncProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]);
  
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error(error.message || "Email ou senha inválidos.");
            return { success: false, error };
        } 
        if (data.user) {
            await fetchAndSyncProfile(data.user);
        }
        return { success: true, error: null };
    } finally {
        setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado para atualizar o perfil.");
    try {
      const { error } = await supabase
        .from('users_custom')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      await fetchAndSyncProfile(user);

    } catch (error) {
      console.error("Erro em updateUserProfile:", error);
      throw error;
    }
  };
  
  const value = { user, loading, isAuthenticated, isFirstLogin, isAdmin, login, signOut, updateUserProfile, fetchAndSyncProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};