import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Pool = Database['public']['Tables']['pools']['Row'];
type ParticipationRow = Database['public']['Tables']['participations']['Row'];

export type AppUser = User & {
  username?: string | null;
  name?: string | null;
  is_admin?: boolean;
  first_login?: boolean;
  avatar_url?: string | null;
};

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
  
  const userRef = useRef<AppUser | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin ?? false;
  const isOwner = !!user && !!activePool && user.id === activePool.owner_id;

  // Função centralizada de Logout e Limpeza
  const signOut = useCallback(async () => {
    // 1. Limpa estado do React
    setUser(null);
    userRef.current = null;
    setActivePool(null);
    setUserParticipations([]);
    
    // 2. Limpa LocalStorage (Remove lixo antigo)
    localStorage.removeItem('activePoolId');
    localStorage.removeItem('sb-wdbaoomwhuiztjoazagd-auth-token'); // Remove token do Supabase se necessário
    
    // 3. Limpa Sessão no Backend
    await supabase.auth.signOut();
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // AUTO-LIMPEZA: Se o usuário existe no Auth mas NÃO na tabela custom (ex: deletado), forçar logout.
      if (error || !profile) {
         console.error("Perfil não encontrado. Forçando logout de limpeza.", error);
         await signOut(); // <--- ISSO CORRIGE O PROBLEMA
         return null;
      }
      
      const combinedUser: AppUser = { 
        ...sessionUser, 
        username: profile.username,
        name: profile.name,
        is_admin: profile.is_admin,
        first_login: profile.first_login,
        avatar_url: profile.avatar_url
      };
      
      setUser(combinedUser);
      userRef.current = combinedUser;
      
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select(`*, pool:pools(*)`)
        .eq('user_id', sessionUser.id);
        
      if (participationsError) throw participationsError;
      
      const participations: Participation[] = (participationsData || []).map((p: any) => ({
        ...p,
        pool: p.pool
      }));

      setUserParticipations(participations);
      
      // Validação de Bolão Ativo
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
        localStorage.removeItem('activePoolId'); // Se não tem bolões, limpa o storage
      }
      
      return combinedUser;

    } catch (error: any) {
      console.error("Erro crítico no fetch profile:", error);
      await signOut(); // Segurança extra: qualquer erro crítico mata a sessão ruim
      return null;
    }
  }, [signOut]);
  
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            // Se o token for inválido, limpa tudo
            await signOut();
        } else if (session?.user) {
            if (mounted) await fetchAndSyncProfile(session.user);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        await signOut();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false);
        } else if (session?.user) {
            const currentUser = userRef.current;
            // Só recarrega se o usuário mudou de verdade
            if (!currentUser || currentUser.id !== session.user.id) {
                 await fetchAndSyncProfile(session.user);
            }
        }
    });

    return () => { 
      mounted = false;
      authListener.subscription.unsubscribe(); 
    };
  }, [fetchAndSyncProfile, signOut]);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        toast.error(error.message || "Email ou senha inválidos.");
        return { success: false, error };
    }
    return { success: true, error: null };
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