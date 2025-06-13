// src/contexts/AuthContext.tsx - VERSÃO ATUALIZADA

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// --- ATUALIZADO: Adicionado pool_id ao tipo do usuário ---
export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  pool_id?: string | null; // <-- ADICIONADO AQUI
};

// --- ATUALIZADO: Adicionado fetchAndSyncProfile ao tipo do contexto ---
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
  fetchAndSyncProfile: (sessionUser: User) => Promise<void>; // <-- ADICIONADO AQUI
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
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    const { data: profile, error } = await supabase
      .from('users_custom')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Combina o usuário da sessão com o perfil do banco de dados
    const combinedUser: AppUser = { ...sessionUser, ...profile };
    setUser(combinedUser);

    setIsAdmin(!!profile?.is_admin);
    // A lógica de primeiro login agora também considera se o usuário já está em um bolão.
    setIsFirstLogin(profile?.first_login !== true);
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            await fetchAndSyncProfile(session.user);
          } else {
            setUser(null);
          }
        } catch (error: any) {
          toast.error(`Falha ao carregar o perfil: ${error.message}`);
          await supabase.auth.signOut();
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]);
  
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado para atualizar o perfil.");
    try {
      const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
      if (error) throw error;
      if (updates.first_login === true) {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error("Erro em updateUserProfile:", error);
      throw error;
    }
  };
  
  // --- ATUALIZADO: Expondo a função no valor do contexto ---
  const value = { user, loading, isAuthenticated, isFirstLogin, isAdmin, login, signOut, updateUserProfile, fetchAndSyncProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};