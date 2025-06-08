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
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil do usuário (RLS?):", error);
        toast.error("Não foi possível carregar seu perfil. Deslogando por segurança.");
        await signOut();
        return;
      }

      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsAdmin(!!profile?.is_admin);

      // LÓGICA CORRIGIDA: `first_login` no banco é `false` se o usuário JÁ fez o primeiro login.
      // Se for `true`, `undefined` ou `null`, então é o primeiro login.
      setIsFirstLogin(profile?.first_login !== false);

    } catch (e: any) {
      console.error("Erro crítico ao buscar perfil:", e);
      toast.error("Erro crítico ao carregar dados do usuário.");
      await signOut();
    }
  }, [signOut]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user;
        if (sessionUser) {
          await fetchAndSyncProfile(sessionUser);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsFirstLogin(false);
        }
        setLoading(false);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        toast.error(error.message || "Email ou senha inválidos.");
    }
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) return;
    try {
      await supabase.from('users_custom').update(updates).eq('id', user.id);
      // Atualiza o estado local para refletir a mudança imediatamente
      if (updates.first_login === false) {
        setIsFirstLogin(false);
        setUser(prevUser => prevUser ? { ...prevUser, first_login: false } : null);
      }
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        toast.error("Não foi possível atualizar seu perfil.");
    }
  };

  const value = { user, loading, isAuthenticated, isFirstLogin, login, signOut, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};