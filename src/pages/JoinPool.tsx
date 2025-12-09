import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PoolJoinCard } from "@/components/pools/PoolJoinCard"; // Verifique se o caminho está certo (singular/plural)
import { LoginGoogle } from "@/components/auth/LoginGoogle"; // <--- Importamos o botão
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";

export default function JoinPoolPage() {
  const { code } = useParams<{ code: string }>();
  const { user, fetchAndSyncProfile } = useAuth(); // Importante: fetchAndSyncProfile
  const navigate = useNavigate();
  
  const [poolData, setPoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [nickname, setNickname] = useState("");

  // Carrega dados do bolão
  useEffect(() => {
    async function loadPoolDetails() {
      if (!code) return;
      try {
        setLoading(true);
        const { data: pool, error } = await supabase
          .from("pools")
          .select(`*, championship:championships(name)`)
          .eq("invite_code", code.toUpperCase())
          .single();

        if (error) throw error;

        // Contagem de participantes
        const { count } = await supabase
          .from("participations")
          .select("*", { count: 'exact', head: true })
          .eq("pool_id", pool.id);

        setPoolData({
            ...pool,
            championship_name: pool.championship?.name,
            participants_count: count || 0
        });
      } catch (error) {
        toast.error("Bolão não encontrado.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    }
    loadPoolDetails();
  }, [code, navigate]);

  // Função unificada para Salvar Apelido (se precisar) e Entrar
  const handleJoin = async () => {
    if (!user) return; // Segurança

    try {
        setJoining(true);

        // 1. Se não tiver username, salva primeiro
        if (!user.username) {
            if (!nickname.trim()) {
                toast.error("Escolha um apelido para participar!");
                setJoining(false);
                return;
            }
            const { error: updateError } = await supabase
                .from("users_custom")
                .update({ username: nickname, first_login: false })
                .eq("id", user.id);
            
            if (updateError) throw updateError;
            
            // Sincroniza o contexto local
            await fetchAndSyncProfile(user);
        }

        // 2. Verifica se já participa
        const { data: existing } = await supabase
            .from("participations")
            .select("id")
            .eq("user_id", user.id)
            .eq("pool_id", poolData.id)
            .maybeSingle();

        if (existing) {
            toast.info("Você já está neste bolão!");
            navigate(`/pool/${poolData.id}`);
            return;
        }

        // 3. Entra no bolão
        const { error } = await supabase.from("participations").insert({
            user_id: user.id,
            pool_id: poolData.id,
            payment_status: 'pending'
        });

        if (error) throw error;

        toast.success("Bem-vindo ao bolão!");
        navigate(`/pool/${poolData.id}`);

    } catch (error: any) {
        toast.error("Erro ao entrar: " + error.message);
    } finally {
        setJoining(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue"/></div>;
  }

  // Se o bolão não carregou
  if (!poolData) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 gap-6">
        
        {/* Renderiza o Card de Detalhes (sem botões de ação internos, vamos controlar fora) */}
        <PoolJoinCard 
            pool={poolData} 
            onJoin={() => {}} // Passamos vazio pois vamos controlar os botões abaixo
            loading={false}
        />

        {/* ÁREA DE AÇÃO (Lógica Inteligente) */}
        <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-green-500">
            <CardContent className="pt-6 text-center space-y-4">
                
                {/* CENÁRIO 1: NÃO LOGADO -> Mostra Google Login */}
                {!user && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-700">Para participar, faça login:</h3>
                        <LoginGoogle />
                        <p className="text-xs text-gray-400">Rápido, seguro e sem senhas.</p>
                    </div>
                )}

                {/* CENÁRIO 2: LOGADO SEM APELIDO -> Pede Apelido */}
                {user && !user.username && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                            <User className="h-4 w-4"/>
                            <span>Falta pouco! Como quer ser chamado no ranking?</span>
                        </div>
                        <Input 
                            placeholder="Seu Apelido (Ex: Imperador)" 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="text-center text-lg font-bold"
                        />
                        <Button className="w-full bg-green-600 hover:bg-green-700 font-bold" onClick={handleJoin} disabled={joining}>
                            {joining ? <Loader2 className="animate-spin"/> : "Salvar e Entrar no Bolão"}
                        </Button>
                    </div>
                )}

                {/* CENÁRIO 3: LOGADO E COM APELIDO -> Botão de Entrar */}
                {user && user.username && (
                    <div className="space-y-2 animate-in fade-in">
                        <p className="text-sm text-gray-600">Entrar como <strong className="text-fifa-blue">{user.username}</strong></p>
                        <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 font-bold shadow-md" onClick={handleJoin} disabled={joining}>
                            {joining ? <Loader2 className="animate-spin mr-2"/> : "Confirmar Entrada"}
                        </Button>
                    </div>
                )}

            </CardContent>
        </Card>
    </div>
  );
}