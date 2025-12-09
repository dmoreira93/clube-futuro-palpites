import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Verifique se a pasta é 'pools' (plural) mesmo
import { PoolJoinCard } from "@/components/pools/PoolJoinCard"; 
import { LoginGoogle } from "@/components/auth/LoginGoogle"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, AlertCircle } from "lucide-react";

export default function JoinPoolPage() {
  const { code } = useParams<{ code: string }>();
  const { user, fetchAndSyncProfile } = useAuth();
  const navigate = useNavigate();
  
  const [poolData, setPoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Estado para erro visual
  const [joining, setJoining] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    async function loadPoolDetails() {
      if (!code) {
          setLoading(false);
          setErrorMsg("Código inválido.");
          return;
      }

      try {
        setLoading(true);
        // Busca simples primeiro para garantir que o código existe
        const { data: pool, error } = await supabase
          .from("pools")
          .select(`
            *,
            championship:championships(name)
          `)
          .eq("invite_code", code.toUpperCase())
          .single();

        if (error || !pool) {
            console.error("Erro busca bolão:", error);
            setErrorMsg("Bolão não encontrado ou código expirado.");
            return;
        }

        // Busca participantes
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
        console.error(error);
        setErrorMsg("Erro ao carregar informações.");
      } finally {
        setLoading(false);
      }
    }
    loadPoolDetails();
  }, [code]);

  const handleJoin = async () => {
    if (!user || !poolData) return; 

    try {
        setJoining(true);

        // 1. Salva apelido se não tiver
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
        setJoining(false);
    }
  };

  // TELA DE CARREGAMENTO
  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-fifa-blue"/>
            <p className="text-gray-500 font-medium">Buscando bolão...</p>
        </div>
    );
  }

  // TELA DE ERRO (Para não ficar tela branca)
  if (errorMsg || !poolData) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h2>
            <p className="text-gray-600 max-w-md mb-6">{errorMsg || "Não foi possível carregar os dados do bolão."}</p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
                Voltar ao Início
            </Button>
        </div>
      );
  }

  // TELA DE SUCESSO (CARD)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 gap-6">
        
        <PoolJoinCard 
            pool={poolData} 
            onJoin={() => {}} 
            loading={false}
        />

        <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-green-500">
            <CardContent className="pt-6 text-center space-y-4">
                
                {!user && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-700">Para participar, faça login:</h3>
                        <LoginGoogle />
                        <p className="text-xs text-gray-400">Rápido, seguro e sem senhas.</p>
                    </div>
                )}

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