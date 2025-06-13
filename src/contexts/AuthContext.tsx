// src/contexts/AuthContext.tsx - VERSÃO REVISADA

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
  fetchAndSyncProfile: (sessionUser: User) => Promise<void>;
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
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAuthenticated = !!user;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); // Limpa o usuário do estado imediatamente
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = a linha pode não existir
        throw error;
      }
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsAdmin(!!profile?.is_admin);
      
      // Lógica de "primeiro login" corrigida e simplificada:
      // O usuário está em "primeiro login" se o campo no banco for `false` ou nulo.
      setIsFirstLogin(profile?.first_login === false);

    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      toast.error("Não foi possível carregar os dados do seu perfil.");
      await signOut(); // Desloga o usuário se não conseguir carregar o perfil
    }
  }, [signOut]);

  useEffect(() => {
    // Busca a sessão inicial para evitar a tela de login piscando
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndSyncProfile(session.user);
      }
      setLoading(false);
    };

    getInitialSession();

    // Ouve por mudanças de estado (LOGIN, LOGOUT)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchAndSyncProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          setIsFirstLogin(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message || "Email ou senha inválidos.");
    } else if (data.user) {
      // Após o login bem-sucedido, busca o perfil para atualizar o estado
      await fetchAndSyncProfile(data.user);
    }

    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado para atualizar o perfil.");
    try {
      const { data, error } = await supabase
        .from('users_custom')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      if(data) {
        // Força a atualização do estado local com os dados do banco
        await fetchAndSyncProfile(user);
      }

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