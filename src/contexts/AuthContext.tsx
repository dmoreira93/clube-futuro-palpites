// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
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
    
    const combinedUser: AppUser = { ...profile, ...sessionUser };
    setUser(combinedUser);

    setIsAdmin(!!profile?.is_admin);
    setIsFirstLogin(profile?.first_login !== true);
  }, []);

  // VERSÃO FINAL CORRIGIDA SEGUINDO A DOCUMENTAÇÃO
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // O callback agora é SÍNCRONO.
        // A lógica async é disparada em um setTimeout para evitar o deadlock.
        setTimeout(async () => {
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
        }, 0);
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

  const value = { user, loading, isAuthenticated, isFirstLogin, isAdmin, login, signOut, updateUserProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};