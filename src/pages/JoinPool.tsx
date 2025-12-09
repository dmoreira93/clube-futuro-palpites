import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Verifique se o caminho da pasta é 'pools' (plural) ou 'pool' (singular) conforme sua estrutura
import { PoolJoinCard } from "@/components/pools/PoolJoinCard"; 
import { LoginGoogle } from "@/components/auth/LoginGoogle"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Search, ArrowRight, AlertCircle } from "lucide-react";

export default function JoinPoolPage() {
  const { code } = useParams<{ code: string }>();
  const { user, fetchAndSyncProfile } = useAuth();
  const navigate = useNavigate();
  
  const [poolData, setPoolData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  
  // Inputs manuais
  const [manualCode, setManualCode] = useState("");
  const [nickname, setNickname] = useState("");

  // Efeito de Busca
  useEffect(() => {
    async function loadPoolDetails() {
      // Se não tem código na URL, não busca nada (fica no modo manual)
      if (!code) return;

      try {
        setLoading(true);
        setErrorMsg(null); // Reseta erros anteriores

        const { data: pool, error } = await supabase
          .from("pools")
          .select(`*, championship:championships(name)`)
          .eq("invite_code", code.toUpperCase())
          .single();

        if (error || !pool) {
            console.error("Erro busca:", error);
            setErrorMsg("Bolão não encontrado ou código inválido.");
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
        setErrorMsg("Erro técnico ao carregar bolão.");
      } finally {
        setLoading(false);
      }
    }
    
    loadPoolDetails();
  }, [code]);

  const handleSearch = () => {
    if (!manualCode.trim()) return;
    // Navega para a mesma página, mas com o código na URL
    navigate(`/join/${manualCode.toUpperCase()}`);
  };

  const handleJoin = async () => {
    if (!user || !poolData) return; 

    try {
        setJoining(true);

        if (!user.username) {
            if (!nickname.trim()) {
                toast.error("Escolha um apelido!");
                setJoining(false);
                return;
            }
            const { error } = await supabase
                .from("users_custom")
                .update({ username: nickname, first_login: false })
                .eq("id", user.id);
            if (error) throw error;
            await fetchAndSyncProfile(user);
        }

        const { data: existing } = await supabase
            .from("participations")
            .select("id")
            .eq("user_id", user.id)
            .eq("pool_id", poolData.id)
            .maybeSingle();

        if (existing) {
            toast.info("Você já participa deste bolão!");
            navigate(`/pool/${poolData.id}`);
            return;
        }

        const { error } = await supabase.from("participations").insert({
            user_id: user.id,
            pool_id: poolData.id,
            payment_status: 'pending'
        });

        if (error) throw error;

        toast.success("Sucesso! Bem-vindo ao bolão.");
        navigate(`/pool/${poolData.id}`);

    } catch (error: any) {
        toast.error(error.message);
        setJoining(false);
    }
  };

  // --- RENDERIZAÇÃO BLINDADA ---

  // 1. Loading: Mostra spinner se estiver buscando
  if (loading) {
    return (
        <div className="h-screen flex flex-col items-center justify-center gap-2 bg-gray-50">
            <Loader2 className="h-10 w-10 animate-spin text-fifa-blue"/>
            <p className="text-gray-500 font-medium">Buscando bolão...</p>
        </div>
    );
  }

  // 2. Erro ou Modo Manual: Se não tem código OU deu erro na busca
  if (!code || errorMsg) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-fifa-blue">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
                        <Search className="h-6 w-6 text-fifa-blue" />
                    </div>
                    <CardTitle className="text-xl">Entrar em um Bolão</CardTitle>
                    <CardDescription>Digite o código de convite para participar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center border border-red-100 flex items-center justify-center gap-2">
                            <AlertCircle className="h-4 w-4"/>
                            {errorMsg}
                        </div>
                    )}
                    <div className="flex flex-col gap-3">
                        <Input 
                            placeholder="Ex: X9Y2Z1" 
                            className="text-center uppercase text-2xl tracking-widest font-bold h-14"
                            maxLength={6}
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button 
                            className="w-full h-12 bg-fifa-blue hover:bg-blue-900 text-lg font-bold" 
                            onClick={handleSearch} 
                            disabled={!manualCode || manualCode.length < 3}
                        >
                            Buscar Bolão <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                    <Button variant="ghost" className="w-full text-gray-400" onClick={() => navigate("/dashboard")}>
                        Cancelar e Voltar
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
  }

  // 3. TRAVA DE SEGURANÇA (A CORREÇÃO PRINCIPAL)
  // Se tem código na URL, não deu erro, mas poolData ainda é null (delay do React), 
  // mostramos carregando em vez de tentar renderizar e quebrar a tela.
  if (!poolData) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-10 w-10 animate-spin text-fifa-blue"/>
        </div>
      );
  }

  // 4. Sucesso: Bolão encontrado
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Card de Detalhes */}
        <PoolJoinCard pool={poolData} onJoin={() => {}} loading={false} />

        {/* Área de Login/Confirmação */}
        <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-green-500">
            <CardContent className="pt-6 text-center space-y-4">
                
                {!user && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-700">Faça login para entrar:</h3>
                        <LoginGoogle />
                        <p className="text-xs text-gray-400">Rápido, seguro e sem senhas.</p>
                    </div>
                )}

                {user && !user.username && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2 text-left">
                            <User className="h-5 w-5 flex-shrink-0"/>
                            <span>Quase lá! Escolha como quer ser chamado no ranking:</span>
                        </div>
                        <Input 
                            placeholder="Seu Apelido (Ex: Imperador)" 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="text-center text-lg font-bold"
                        />
                        <Button className="w-full bg-green-600 hover:bg-green-700 font-bold h-12" onClick={handleJoin} disabled={joining}>
                            {joining ? <Loader2 className="animate-spin"/> : "Salvar e Entrar"}
                        </Button>
                    </div>
                )}

                {user && user.username && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-sm">
                            Entrando como: <strong className="text-lg block text-fifa-blue">{user.username}</strong>
                        </div>
                        <Button className="w-full h-14 text-xl bg-green-600 hover:bg-green-700 font-bold shadow-md transition-all hover:scale-105" onClick={handleJoin} disabled={joining}>
                            {joining ? <Loader2 className="animate-spin mr-2"/> : "Confirmar Entrada no Bolão"}
                        </Button>
                    </div>
                )}
                
                <Button variant="link" size="sm" className="text-gray-400 mt-2" onClick={() => navigate("/dashboard")}>
                    Não é este bolão? Cancelar
                </Button>

            </CardContent>
        </Card>
    </div>
  );
}