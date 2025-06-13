// src/contexts/AuthContext.tsx - VERSÃO FINAL E UNIFICADA

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Tipos de usuário, incluindo o pool_id que havia se perdido
export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  pool_id?: string | null;
};

// Interface do Contexto
interface AuthContextType {
  user: AppUser | null;
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

// Componente Provedor
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados derivados: mais seguros e sempre em sincronia com o objeto 'user'
  const isAuthenticated = !!user;
  const isFirstLogin = user ? user.first_login === false : false;
  const isAdmin = user?.is_admin ?? false;

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
      await signOut();
      return null;
    }
  }, [signOut]);

  useEffect(() => {
    // Verificação inicial da sessão ao carregar a página
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndSyncProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false); // Sem sessão, termina o carregamento
      }
    });

    // Listener para mudanças de autenticação (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Reintroduzindo sua solução do setTimeout para evitar deadlocks
        setTimeout(async () => {
          setLoading(true);
          if (session?.user) {
            await fetchAndSyncProfile(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, 0);
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
    }
    // O listener onAuthStateChange cuidará do resto
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login' | 'pool_id'>>) => {
    if (!user) throw new Error("Usuário não autenticado para atualizar o perfil.");
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) {
        toast.error("Erro ao atualizar perfil.");
        throw error;
    };
    await fetchAndSyncProfile(user); // Re-sincroniza o estado local com o banco
  };
  
  const value = { user, loading, isAuthenticated, isFirstLogin, isAdmin, login, signOut, updateUserProfile, fetchAndSyncProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};