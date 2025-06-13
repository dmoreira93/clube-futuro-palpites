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
    
    const combinedUser: AppUser = { ...sessionUser, ...profile };
    setUser(combinedUser);
    setIsAdmin(!!profile?.is_admin);
    
    // A lógica de primeiro login agora é baseada diretamente no perfil do banco de dados
    setIsFirstLogin(profile?.first_login === false);
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        try {
          if (session?.user) {
            await fetchAndSyncProfile(session.user);
          } else {
            setUser(null);
            setIsAdmin(false);
            setIsFirstLogin(false);
          }
        } catch (error: any) {
          toast.error(`Falha ao carregar o perfil: ${error.message}`);
          await supabase.auth.signOut();
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
      const { data, error } = await supabase
        .from('users_custom')
        .update(updates)
        .eq('id', user.id)
        .select() // <-- Pede ao Supabase para retornar a linha atualizada
        .single();

      if (error) throw error;
      
      // --- ALTERAÇÃO PRINCIPAL AQUI ---
      // Atualiza o estado local do usuário com os dados recém-salvos no banco
      if(data) {
        const updatedUser: AppUser = { ...user, ...data };
        setUser(updatedUser);
        setIsFirstLogin(updatedUser.first_login === false);
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