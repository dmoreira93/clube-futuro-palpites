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
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
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
  const isAuthenticated = !!user;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); // Limpa o estado local imediatamente
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro RLS/DB ao buscar perfil:", error);
        toast.error("Não foi possível carregar seu perfil. Verifique as permissões (RLS).");
        await signOut(); // Desloga se não conseguir ler o perfil
        return;
      }

      if (!profile) {
        console.warn(`Perfil não encontrado para o usuário: ${sessionUser.id}. Tratando como primeiro login.`);
        setUser(sessionUser);
        setIsAdmin(false);
        setIsFirstLogin(true);
        return;
      }

      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsFirstLogin(profile.first_login !== true); // `first_login` false ou null significa que precisa trocar a senha.
      setIsAdmin(!!profile.is_admin);
    } catch (e: any) {
      console.error("Erro crítico ao buscar perfil:", e);
      toast.error("Erro crítico ao carregar dados do usuário.");
      await signOut();
    }
  }, [signOut]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchAndSyncProfile(session.user);
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
      if (updates.first_login === true) {
          setIsFirstLogin(false);
      }
    } catch(error) {
        console.error("Erro ao atualizar perfil:", error);
        toast.error("Não foi possível atualizar seu perfil.");
    }
  };

  const value = { user, loading, isAuthenticated, isFirstLogin, isAdmin, login, updateUserProfile, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};