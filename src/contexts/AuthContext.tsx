// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// Tipos auxiliares gerados pelo Supabase
type Pool = Database['public']['Tables']['pools']['Row'];
type ParticipationRow = Database['public']['Tables']['participations']['Row'];

// O AppUser é APENAS o usuário logado (sem contexto de bolão)
export type AppUser = User & {
  username?: string | null;
  name?: string | null;
  is_admin?: boolean;
  first_login?: boolean;
  avatar_url?: string | null;
};

// Interface para a participação completa (com os dados do bolão populados)
export interface Participation extends ParticipationRow {
  pool: Pool;
}

interface AuthContextType {
  user: AppUser | null;
  activePool: Pool | null; 
  userParticipations: Participation[]; 
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  switchPool: (poolId: string) => void; 
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
  fetchAndSyncProfile: (sessionUser: User) => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [userParticipations, setUserParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  // Verifica se é admin global do sistema
  const isAdmin = user?.is_admin ?? false;
  // Verifica se é dono do bolão ATIVO
  const isOwner = !!user && !!activePool && user.id === activePool.owner_id;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActivePool(null);
    setUserParticipations([]);
    localStorage.removeItem('activePoolId');
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      // 1. Busca dados do perfil (users_custom)
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Combina dados de Auth com dados customizados
      const combinedUser: AppUser = { 
        ...sessionUser, 
        username: profile?.username,
        name: profile?.name,
        is_admin: profile?.is_admin,
        first_login: profile?.first_login,
        avatar_url: profile?.avatar_url
      };
      
      setUser(combinedUser);
      
      // 2. Busca participações e popula os dados do bolão
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select(`
          *,
          pool:pools(*)
        `)
        .eq('user_id', sessionUser.id);
        
      if (participationsError) throw participationsError;
      
      // Mapeia para o formato correto (Garante que pool não é null/array)
      const participations: Participation[] = (participationsData || []).map((p: any) => ({
        ...p,
        pool: p.pool // O Supabase já traz o objeto pool aqui devido à relação
      }));

      setUserParticipations(participations);
      
      // 3. Define o bolão ativo (Recupera da memória ou pega o primeiro)
      if (participations.length > 0) {
        const lastActivePoolId = localStorage.getItem('activePoolId');
        const lastActiveParticipation = participations.find(p => p.pool_id === lastActivePoolId);
        
        if (lastActiveParticipation) {
            setActivePool(lastActiveParticipation.pool);
        } else {
            setActivePool(participations[0].pool);
            localStorage.setItem('activePoolId', participations[0].pool.id);
        }
      } else {
        setActivePool(null);
      }
      
      return combinedUser;
    } catch (error: any) {
      console.error("Erro ao buscar perfil/bolões:", error);
      // Se der erro crítico de auth, faz logout para evitar loop
      // await signOut(); 
      return null;
    }
  }, [signOut]);
  
  useEffect(() => {
    setLoading(true);
    
    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndSyncProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de auth (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const sessionUser = session?.user;
        if (sessionUser) {
            // Se logou, busca perfil
            if (!user || user.id !== sessionUser.id) {
                fetchAndSyncProfile(sessionUser);
            }
        } else {
            // Se deslogou, limpa tudo
            setUser(null);
            setActivePool(null);
            setUserParticipations([]);
        }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [fetchAndSyncProfile, user]);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) { toast.error("Erro ao atualizar perfil."); throw error; };
    await fetchAndSyncProfile(user);
  };

  const switchPool = (poolId: string) => {
      const participation = userParticipations.find(p => p.pool.id === poolId);
      if (participation) {
          setActivePool(participation.pool);
          localStorage.setItem('activePoolId', poolId);
          toast.success(`Bolão alterado para: ${participation.pool.name}`);
      }
  };
  
  const value = { 
    user, 
    activePool, 
    userParticipations, 
    loading, 
    isAuthenticated, 
    isOwner, 
    isAdmin, 
    login, 
    signOut, 
    updateUserProfile, 
    fetchAndSyncProfile, 
    switchPool 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};