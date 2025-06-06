import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  total_points?: number;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirstLogin: boolean;
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
  const [loading, setLoading] = useState(true); // Começa como true até a sessão inicial ser verificada
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Não precisa navegar aqui, o useEffect que escuta a sessão vai lidar com isso
  }, []);

  useEffect(() => {
    // Escuta mudanças no estado de autenticação (login, logout, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true); // Começa a carregar sempre que o estado de auth muda
        if (!session) {
          // Se não há sessão (logout ou sessão expirada)
          setUser(null);
          setIsFirstLogin(false);
          setLoading(false);
          navigate('/login');
          return;
        }

        try {
          // Se há uma sessão, busca o perfil customizado
          const { data: profile, error } = await supabase
            .from('users_custom')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            // Se der erro ao buscar o perfil (ex: RLS), desloga o usuário
            console.error("Erro ao buscar perfil, deslogando:", error);
            await signOut();
            return;
          }

          if (profile) {
            // Se encontrou o perfil, combina os dados e atualiza o estado
            const combinedUser: AppUser = { ...session.user, ...profile };
            setUser(combinedUser);
            setIsFirstLogin(!profile.first_login);
          } else {
            // Este caso não deveria acontecer se o trigger do BD estiver funcionando, mas é uma salvaguarda
            console.warn("Usuário autenticado sem perfil em users_custom. Deslogando.");
            await signOut();
          }
        } catch (e) {
          console.error("Erro crítico no onAuthStateChange, deslogando:", e);
          await signOut();
        } finally {
          setLoading(false); // Termina de carregar
        }
      }
    );

    return () => {
      // Limpa o listener quando o componente é desmontado
      authListener.subscription.unsubscribe();
    };
  }, [navigate, signOut]); // Adiciona navigate e signOut como dependências estáveis

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

  const value = {
    user,
    loading,
    isFirstLogin,
    updateUserProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};