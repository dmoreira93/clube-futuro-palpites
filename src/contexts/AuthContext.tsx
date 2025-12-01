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

  // Função FORTE de limpeza - Limpa TUDO para evitar loops
  const signOut = useCallback(async () => {
    console.log("🛑 Logout forçado/solicitado. Limpando sessão...");
    
    // 1. Limpa estados React
    setUser(null);
    userRef.current = null;
    setActivePool(null);
    setUserParticipations([]);
    
    // 2. Limpa Storage IMEDIATAMENTE (antes de chamar o supabase)
    // Isso evita que, se o supabase falhar, o token continue lá no F5
    localStorage.removeItem('activePoolId');
    localStorage.removeItem('sb-wdbaoomwhuiztjoazagd-auth-token'); // Nome padrão do token Supabase
    
    // Limpa qualquer chave que comece com sb-
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    
    sessionStorage.clear();
    setLoading(false);

    // 3. Avisa o Supabase (pode falhar se a rede estiver off, mas o storage já foi limpo)
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("Erro ao notificar Supabase do logout (ignorado):", e);
    }
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    // Se já estivermos carregando o mesmo usuário, retorna o atual para evitar chamadas duplas
    if (userRef.current?.id === sessionUser.id) {
        return userRef.current;
    }

    try {
      console.log("🔄 Sincronizando perfil:", sessionUser.email);
      
      // 1. Busca Perfil
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle(); // Usamos maybeSingle para não gerar erro de exceção se não existir

      if (error) {
         console.error("Erro ao buscar users_custom:", error);
         throw error;
      }

      // Se não tem perfil, é uma "Sessão Fantasma". Logout nela.
      if (!profile) {
          console.warn("⚠️ Usuário autenticado mas sem perfil. Logout.");
          await signOut();
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
      
      // Atualiza estado
      setUser(combinedUser);
      userRef.current = combinedUser;
      
      // 2. Busca Participações (em paralelo se possível, mas sequencial é mais seguro aqui)
      const { data: participationsData } = await supabase
        .from('participations')
        .select(`*, pools(*)`) 
        .eq('user_id', sessionUser.id);
        
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
      console.error("❌ Erro crítico no fetchAndSyncProfile:", error);
      // Se deu erro de rede ou banco, NÃO faz logout imediatamente, apenas retorna null.
      // Isso evita o loop de "Erro -> Logout -> Login Automático -> Erro".
      return null;
    }
  }, [signOut]);
  
  useEffect(() => {
    let mounted = true;

    // --- DISJUNTOR DE SEGURANÇA (TIMEOUT) ---
    // Aumentado para 8s e APENAS para o loading visual
    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.warn("⚠️ Timeout de inicialização (8s). Liberando interface.");
            setLoading(false);
        }
    }, 8000);

    const initAuth = async () => {
      try {
        // Tenta pegar a sessão do storage
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Erro na sessão inicial:", error);
            if (mounted) setLoading(false);
            return;
        }

        if (session?.user) {
            console.log("✅ Sessão recuperada. Carregando dados...");
            if (mounted) {
                const profile = await fetchAndSyncProfile(session.user);
                // Se falhou ao carregar perfil (ex: erro de rede), o loading vira false 
                // e o usuário fica na tela de login (ou onde estiver), sem loop.
            }
        }
      } catch (error) {
        console.error("Exceção na inicialização:", error);
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    initAuth();

    // Listener de eventos do Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`🔔 Auth Event: ${event}`);
        
        if (event === 'SIGNED_OUT') {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
                 await fetchAndSyncProfile(session.user);
                 setLoading(false); // Garante que o loading pare após login
            }
        } else if (event === 'INITIAL_SESSION') {
            // Já tratado no initAuth, mas serve de backup
            if (session?.user) {
                 await fetchAndSyncProfile(session.user);
            }
            setLoading(false);
        }
    });

    return () => { 
      mounted = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe(); 
    };
  }, [fetchAndSyncProfile]); // Removido 'signOut' das dependências para evitar recriação
  
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            setLoading(false);
            return { success: false, error };
        }

        if (data.session?.user) {
            const profile = await fetchAndSyncProfile(data.session.user);
            if (!profile) {
                setLoading(false);
                return { success: false, error: new Error("Falha ao carregar perfil.") };
            }
        }
        
        // Sucesso total
        return { success: true, error: null };
    } catch (err) {
        setLoading(false);
        return { success: false, error: err };
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) return;
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) { toast.error("Erro ao atualizar perfil."); throw error; };
    await fetchAndSyncProfile(user);
  };

  const switchPool = (poolId: string) => {
      const participation = userParticipations.find(p => p.pool.id === poolId);
      if (participation) {
          setActivePool(participation.pool);
          localStorage.setItem('activePoolId', poolId);
          toast.success(`Bolão: ${participation.pool.name}`);
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