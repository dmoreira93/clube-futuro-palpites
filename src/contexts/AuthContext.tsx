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
    
    // Removemos o safetyTimer e o initAuth() que faziam a chamada getSession() manualmente

    // 1. Inicia o listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return; // Evita erro se o componente for desmontado

        console.log(`🔔 Auth Event: ${event}`);
        
        // --- 1. TRATAMENTO DE LOGOUT ---
        if (event === 'SIGNED_OUT') {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false); 
            return; // Encerra o processamento
        } 
        
        // --- 2. TRATAMENTO DE SESSÃO ATIVA (Login / Refresh / Token / Inicialização) ---
        else if (session?.user) {
            // Se o evento é INITIAL_SESSION (carregamento do F5/cache) ou SIGNED_IN (login)
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
                // Seta loading true APENAS se não for SIGNED_OUT e ainda não tivermos o user
                if (!user) setLoading(true); 
                
                await fetchAndSyncProfile(session.user);
            }
        } 
        
        // --- 3. GARANTIA DE PARADA DE LOADING ---
        // Em QUALQUER caso, garantimos que o loading pare.
        setLoading(false); 
    });

    // 4. Se o TanStack Query começar a rodar antes, ele vê loading=false, mas user=null.
    // Isso é esperado e o query deve verificar `isAuthenticated` ou `user` antes de rodar.

    return () => { 
        mounted = false;
        authListener.subscription.unsubscribe(); 
    };
}, [fetchAndSyncProfile, user]); // Adicionei 'user' aqui. Se o user mudar, re-avalie.

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