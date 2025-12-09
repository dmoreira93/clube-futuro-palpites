import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PoolJoinCard } from "@/components/pools/PoolJoinCard"; 
import { LoginGoogle } from "@/components/auth/LoginGoogle"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Search, ArrowRight } from "lucide-react";

export default function JoinPoolPage() {
  const { code } = useParams<{ code: string }>();
  const { user, fetchAndSyncProfile } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [poolData, setPoolData] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Começa false para verificar o código primeiro
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  
  // Estados para entrada manual
  const [manualCode, setManualCode] = useState("");
  const [nickname, setNickname] = useState("");

  // 1. EFEITO: Carrega bolão SE tiver código na URL
  useEffect(() => {
    async function loadPoolDetails() {
      if (!code) return; // Se não tem código, não faz nada (fica no modo manual)

      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: pool, error } = await supabase
          .from("pools")
          .select(`*, championship:championships(name)`)
          .eq("invite_code", code.toUpperCase())
          .single();

        if (error || !pool) {
            setErrorMsg("Bolão não encontrado ou código inválido.");
            return;
        }

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
        setErrorMsg("Erro ao carregar bolão.");
      } finally {
        setLoading(false);
      }
    }
    
    loadPoolDetails();
  }, [code]);

  // Ação: Buscar Bolão Manualmente
  const handleSearch = () => {
    if (!manualCode.trim()) return;
    navigate(`/join/${manualCode.toUpperCase()}`);
  };

  // Ação: Entrar no Bolão
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

  // --- RENDERIZAÇÃO ---

  // CASO 1: CARREGANDO (Só aparece se tiver código e estiver buscando)
  if (loading) {
    return <div className="h-screen flex flex-col items-center justify-center gap-2"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue"/><p className="text-gray-500">Buscando bolão...</p></div>;
  }

  // CASO 2: SEM CÓDIGO NA URL (Modo Digitação) ou CÓDIGO INVÁLIDO
  if (!code || errorMsg) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
                        <Search className="h-6 w-6 text-fifa-blue" />
                    </div>
                    <CardTitle>Entrar em um Bolão</CardTitle>
                    <CardDescription>Digite o código de convite para participar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center border border-red-100">
                            {errorMsg}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Ex: X9Y2Z1" 
                            className="text-center uppercase text-lg tracking-widest font-bold h-12"
                            maxLength={6}
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button className="w-full h-12 bg-fifa-blue hover:bg-blue-900 text-lg" onClick={handleSearch} disabled={!manualCode}>
                        Buscar Bolão <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="ghost" className="w-full text-gray-400" onClick={() => navigate("/dashboard")}>
                        Cancelar
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
  }

  // CASO 3: BOLÃO ENCONTRADO (Mostra Card de Confirmação)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 gap-6">
        
        {/* Card de Detalhes */}
        <PoolJoinCard pool={poolData} onJoin={() => {}} loading={false} />

        {/* Área de Login/Confirmação */}
        <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-green-500">
            <CardContent className="pt-6 text-center space-y-4">
                
                {!user && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-700">Faça login para entrar:</h3>
                        <LoginGoogle />
                        <p className="text-xs text-gray-400">Rápido e seguro.</p>
                    </div>
                )}

                {user && !user.username && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
                            <User className="h-4 w-4"/>
                            <span>Como quer ser chamado?</span>
                        </div>
                        <Input 
                            placeholder="Seu Apelido" 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="text-center text-lg font-bold"
                        />
                        <Button className="w-full bg-green-600 hover:bg-green-700 font-bold" onClick={handleJoin} disabled={joining}>
                            {joining ? <Loader2 className="animate-spin"/> : "Confirmar e Entrar"}
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
                
                <Button variant="link" size="sm" className="text-gray-400 mt-2" onClick={() => navigate("/dashboard")}>
                    Não é este bolão? Voltar
                </Button>

            </CardContent>
        </Card>
    </div>
  );
}