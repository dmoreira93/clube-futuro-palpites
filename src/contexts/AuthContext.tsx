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

  // Função FORTE de limpeza
  const signOut = useCallback(async () => {
    console.log("Executando limpeza completa de sessão...");
    setUser(null);
    userRef.current = null;
    setActivePool(null);
    setUserParticipations([]);
    
    // Limpa TUDO do navegador relacionado a sessão
    localStorage.removeItem('activePoolId');
    localStorage.removeItem('sb-wdbaoomwhuiztjoazagd-auth-token');
    sessionStorage.clear();
    
    // Garante que o loading pare
    setLoading(false);

    await supabase.auth.signOut();
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    console.log("Iniciando sincronização de perfil para:", sessionUser.id);
    try {
      // 1. Busca Perfil
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error) {
         console.error("Erro ao buscar users_custom:", error);
         // Não fazemos signOut automático aqui para permitir debug, a menos que seja crítico
         if (error.code === 'PGRST116') {
             console.error("Perfil não encontrado na tabela users_custom.");
         }
         await signOut(); // Mantemos o signOut se o perfil não existir, pois a app precisa dele
         return null;
      }
      
      console.log("Perfil carregado com sucesso:", profile.id);

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
      
      // 2. Busca Participações
      const { data: participationsData, error: partError } = await supabase
        .from('participations')
        .select(`*, pools(*)`) 
        .eq('user_id', sessionUser.id);

      if (partError) console.error("Erro ao buscar participações:", partError);
        
      // Mapeamento seguro
      const participations: Participation[] = (participationsData || []).map((p: any) => {
        const poolData = p.pools || p.pool;
        return { ...p, pool: poolData };
      }).filter(p => p.pool);

      setUserParticipations(participations);
      
      // 3. Define Bolão Ativo
      if (participations.length > 0) {
        const lastActivePoolId = localStorage.getItem('activePoolId');
        const lastActiveParticipation = participations.find(p => p.pool.id === lastActivePoolId);
        
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
      console.error("Erro crítico no AuthContext (fetchAndSyncProfile):", error);
      await signOut();
      return null;
    }
  }, [signOut]);
  
  useEffect(() => {
    let mounted = true;

    // --- DISJUNTOR DE SEGURANÇA (ATUALIZADO) ---
    // Aumentado para 10 segundos e REMOVIDO o signOut automático
    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.warn("⚠️ Timeout de carregamento atingido (10s). Liberando tela sem logout.");
            setLoading(false);
            // NOTA: Removemos o signOut() daqui. Se o DB estiver lento, apenas liberamos a UI.
        }
    }, 10000); 

    const initAuth = async () => {
      try {
        console.log("Verificando sessão inicial...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Erro na sessão inicial:", error);
            await signOut();
        } else if (session?.user) {
            console.log("Sessão encontrada, buscando perfil...");
            if (mounted) await fetchAndSyncProfile(session.user);
        } else {
            console.log("Nenhuma sessão ativa.");
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        await signOut();
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer); 
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Mudança de estado Auth:", event);
        if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false);
        } else if (session?.user) {
            const currentUser = userRef.current;
            if (!currentUser || currentUser.id !== session.user.id) {
                 await fetchAndSyncProfile(session.user);
            }
        }
    });

    return () => { 
      mounted = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe(); 
    };
  }, [fetchAndSyncProfile, signOut]); 
  
  const login = async (email: string, password: string) => {
    console.log("Tentando login...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        console.error("Erro no signInWithPassword:", error);
        toast.error(error.message || "Email ou senha inválidos.");
        return { success: false, error };
    }

    if (data.session?.user) {
        try {
            // Forçamos a busca do perfil e aguardamos
            const profile = await fetchAndSyncProfile(data.session.user);
            
            if (!profile) {
                return { 
                    success: false, 
                    error: new Error("Utilizador autenticado, mas perfil não encontrado.") 
                };
            }
        } catch (err) {
            return { 
                success: false, 
                error: err 
            };
        }
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