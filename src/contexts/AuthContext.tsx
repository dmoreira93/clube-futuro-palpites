// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner'; // Importar o sonner para dar feedback

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  total_points?: number;
};

// 1. ADICIONAR A FUNÇÃO 'login' À INTERFACE DO CONTEXTO
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirstLogin: boolean;
  isAdmin: boolean; // Adicionado para consistência
  login: (email: string, password: string) => Promise<boolean>; // <-- ADICIONADO AQUI
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  signOut: () => Promise<void>;
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

  // 2. IMPLEMENTAR A LÓGICA DE LOGIN
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Trata erros comuns de login de forma amigável
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha inválidos.');
        } else {
          toast.error(`Erro no login: ${error.message}`);
        }
        return false;
      }
      
      // onAuthStateChange vai lidar com a atualização do estado do usuário.
      // Apenas retornamos sucesso.
      return true;

    } catch (err: any) {
      console.error("Erro inesperado no login:", err);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // O listener onAuthStateChange irá lidar com a atualização do estado para null
  }, []);
  
  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error || !profile) {
        console.error("Perfil não encontrado ou erro de RLS. Deslogando.", error);
        await supabase.auth.signOut();
        return;
      }
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsFirstLogin(profile.first_login === false); // Ajuste: !false = true, !true = false
      setIsAdmin(profile.is_admin === true);

    } catch (e) {
      console.error("Erro crítico ao buscar perfil. Deslogando.", e);
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchAndSyncProfile(session.user);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchAndSyncProfile(session.user);
        } else {
          setUser(null);
          setIsFirstLogin(false);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]);

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users_custom')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(prevUser => (prevUser ? { ...prevUser, ...data } : null));
      if (updates.first_login === true) {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  // 3. ADICIONAR A FUNÇÃO 'login' AO VALOR FORNECIDO PELO CONTEXTO
  const value = { user, loading, isFirstLogin, isAdmin, login, updateUserProfile, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};