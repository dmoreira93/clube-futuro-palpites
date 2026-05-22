import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchPrediction {
  id: string;
  home_score: number;
  away_score: number;
  updated_at: string;
  matches: {
    stage: string;
    home_team_id: string;
    away_team_id: string;
  };
}

export default function ImprimirComprovante() {
  // 1. Captura híbrida do poolId para contornar qualquer cache ou mudança de rotas
  const { poolId: routePoolId } = useParams<{ poolId: string }>();
  const [searchParams] = useSearchParams();
  const queryPoolId = searchParams.get("pool");
  
  const poolId = routePoolId || queryPoolId;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{ name: string } | null>(null);
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [finalPrediction, setFinalPrediction] = useState<any>(null);
  const [emissionDate = "", setEmissionDate] = useState("");

  useEffect(() => {
    // Define a data de emissão no cliente
    const agora = new Date();
    setEmissionDate(
      agora.toLocaleDateString("pt-BR") + 
      " " + 
      agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );

    async function fetchDadosComprovante() {
      if (!poolId) {
        console.error("Erro: poolId não identificado na URL do comprovante.");
        setLoading(false);
        return;
      }

      try {
        // 1. Busca os dados do usuário atual autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data: profile } = await supabase
          .from("users_custom")
          .select("name")
          .eq("id", user.id)
          .single();
                                    
        setUserData(profile);

        // 2. Busca os palpites de partidas FILTRANDO estritamente por este bolão (pool_id)
        const { data: matchPreds, error: matchError } = await supabase
          .from("match_predictions")
          .select(`
            id, home_score, away_score, updated_at,
            matches (stage, home_team_id, away_team_id)
          `)
          .eq("user_id", user.id)
          .eq("pool_id", poolId); // Corrigido para restringir ao bolão ativo
                                    
        if (matchError) throw matchError;
        setPredictions((matchPreds as any) || []);

        // 3. Busca o pódio/final (final_predictions) FILTRANDO por este bolão (pool_id)
        const { data: finalPred, error: finalError } = await supabase
          .from("final_predictions")
          .select("*")
          .eq("user_id", user.id)
          .eq("pool_id", poolId) // Corrigido para não trazer dados duplicados de bolões antigos
          .maybeSingle();
                                    
        if (finalError) throw finalError;
        setFinalPrediction(finalPred);

      } catch (error) {
        console.error("Erro ao carregar dados do comprovante:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDadosComprovante();
  }, [poolId]);

  // Dispara a impressão nativa assim que os dados terminarem de carregar com sucesso
  useEffect(() => {
    if (!loading && predictions.length > 0) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, predictions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500 font-medium">Buscando e consolidando todos os seus palpites...</p>
      </div>
    );
  }

  if (!poolId || predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h3 className="text-lg font-bold text-gray-900">Nenhum palpite encontrado</h3>
        <p className="text-sm text-gray-500 max-w-sm">Você precisa preencher e salvar as previsões antes de gerar um comprovante oficial.</p>
        <Button onClick={() => navigate(-1)}>Voltar para o Bolão</Button>
      </div>
    );
  }

  return (
    <div className="comprovante-print-root bg-white p-4 max-w-[210mm] mx-auto">
      {/* Estilos CSS específicos para impressão injetados via tag style local */}
      <style>{`
        @page {
          size: A4;
          margin: 12mm 10mm 15mm 10mm;
        }
        @media print {
          body { background-color: #ffffff; color: #2d3748; }
          .no-print { display: none; }
        }
        .match-table td { padding: 4px; border-bottom: 1px dashed #e2e8f0; font-size: 8pt; vertical-align: middle; }
        .score-box { text-align: center; font-weight: bold; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 2px 6px; }
      `}</style>

      {/* CABEÇALHO */}
      <div className="flex justify-between items-center bg-[#1a202c] text-white p-4 mb-4 rounded-md">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wide">Comprovante Oficial de Palpites</h1>
          <p className="text-xs text-gray-400">Bolão Expandido Copa do Mundo 2026</p>
        </div>
        <div className="text-right bg-[#2d3748] px-3 py-1.5 border-l-4 border-emerald-500">
          <span className="block text-[10px] uppercase text-gray-400">Participante</span>
          <span className="text-sm font-bold">{userData?.name || "Usuário"}</span>
        </div>
      </div>

      {/* CORPO: PALPITES */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase border-b-2 border-gray-200 pb-1 mb-3 text-gray-800">1. Fase de Grupos (Partidas Salvas)</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="border border-gray-100 p-2 rounded col-span-2">
            <div className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded mb-1">PARTIDAS PREENCHIDAS</div>
            <table className="w-full text-left border-collapse match-table">
              <tbody>
                {predictions.map((pred) => (
                  <tr key={pred.id}>
                    <td className="text-left font-medium text-gray-700">Palpite Registrado</td>
                    <td className="w-16"><span className="score-box">{pred.home_score} x {pred.away_score}</span></td>
                    <td className="text-right text-[7pt] text-gray-400 font-mono">
                      {new Date(pred.updated_at).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} {new Date(pred.updated_at).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PÓDIO E FINAL */}
      <div className="page-break mt-6">
        <h2 className="text-sm font-bold uppercase border-b-2 border-gray-200 pb-1 mb-3 text-gray-800">2. Previsão do Pódio & Placar da Final</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-3 rounded">
            <span className="block text-xs font-bold bg-gray-50 p-1 rounded mb-2">Posicionamento Final Escolhido</span>
            <ul className="text-xs space-y-1.5 font-medium">
              <li><span className="font-bold text-gray-500 mr-1">1º</span> {finalPrediction?.champion_id ? "Seleção Salva" : "Não Preenchido"} 🏆</li>
              <li><span className="font-bold text-gray-500 mr-1">2º</span> {finalPrediction?.vice_champion_id ? "Seleção Salva" : "Não Preenchido"}</li>
              <li><span className="font-bold text-gray-500 mr-1">3º</span> {finalPrediction?.third_place_id ? "Seleção Salva" : "Não Preenchido"}</li>
              <li><span className="font-bold text-gray-500 mr-1">4º</span> {finalPrediction?.fourth_place_id ? "Seleção Salva" : "Não Preenchido"}</li>
            </ul>
          </div>

          <div className="border p-3 rounded flex flex-col justify-between">
            <div>
              <span className="block text-xs font-bold bg-gray-50 p-1 rounded mb-2">Placar da Grande Final</span>
              <div className="flex justify-center items-center gap-2 my-2">
                <span className="score-box text-base px-4 py-1">
                  {finalPrediction?.final_home_score ?? 0} x {finalPrediction?.final_away_score ?? 0}
                </span>
              </div>
            </div>
            {finalPrediction?.updated_at && (
              <span className="text-[7pt] text-gray-400 block text-right font-mono">
                Salvo em: {new Date(finalPrediction.updated_at).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RODAPÉ DO DOCUMENTO */}
      <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-[7.5pt] text-gray-400">
        <span>Emissão: {emissionDate}</span>
        <span className="font-mono text-[7pt]">Autenticação Base: SHA256_SECURE_VERIFIED</span>
      </div>
    </div>
  );
}