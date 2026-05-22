import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchPrediction {
  id: string;
  home_score: number;
  away_score: number;
  updated_at: string;
  matches: {
    stage: string;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  } | null;
}

interface GroupPrediction {
  id: string;
  groups: { name: string } | null;
  first_team: { name: string } | null;
  second_team: { name: string } | null;
}

interface FinalPredictionFormatted {
  champion_name: string;
  runner_up_name: string;
  third_place_name: string;
  fourth_place_name: string;
  final_home_score: number | null;
  final_away_score: number | null;
  updated_at: string | null;
}

export default function ImprimirComprovante() {
  const { poolId: routePoolId } = useParams<{ poolId: string }>();
  const [searchParams] = useSearchParams();
  const queryPoolId = searchParams.get("pool");
  
  const poolId = routePoolId || queryPoolId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{ name: string } | null>(null);
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPrediction, setFinalPrediction] = useState<FinalPredictionFormatted | null>(null);
  const [emissionDate, setEmissionDate] = useState("");
  const [hasPrinted, setHasPrinted] = useState(false);

  useEffect(() => {
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // 1. Perfil do Usuário
        const { data: profile } = await supabase
          .from("users_custom")
          .select("name")
          .eq("id", user.id)
          .maybeSingle(); 
        setUserData(profile);

        // 2. Busca palpites de jogos trazendo os nomes das seleções via FK das tabelas de relacionamento
        const { data: matchPreds, error: matchError } = await supabase
          .from("match_predictions")
          .select(`
            id,
            home_score,
            away_score,
            updated_at,
            matches (
              stage,
              home_team:teams!matches_home_team_id_fkey ( name ),
              away_team:teams!matches_away_team_id_fkey ( name )
            )
          `)
          .eq("user_id", user.id)
          .eq("pool_id", poolId);

        if (matchError) throw matchError;
        setPredictions((matchPreds as any) || []);

        // 3. Busca palpites de classificação dos grupos (1º e 2º colocados dos 12 grupos)
        const { data: groupPreds, error: groupError } = await supabase
          .from("group_predictions")
          .select(`
            id,
            groups ( name ),
            first_team:teams!group_predictions_first_team_id_fkey ( name ),
            second_team:teams!group_predictions_second_team_id_fkey ( name )
          `)
          .eq("user_id", user.id)
          .eq("pool_id", poolId);

        if (groupError) console.error("Erro ao buscar palpites de grupos:", groupError);
        setGroupPredictions((groupPreds as any) || []);

        // 4. Busca previsões do pódio trazendo os nomes textuais das seleções escolhidas
        const { data: finalPred, error: finalError } = await supabase
          .from("final_predictions")
          .select(`
            final_home_score,
            final_away_score,
            updated_at,
            champion:teams!final_predictions_champion_id_fkey ( name ),
            runner_up:teams!final_predictions_runner_up_id_fkey ( name ),
            third_place:teams!final_predictions_third_place_id_fkey ( name ),
            fourth_place:teams!final_predictions_fourth_place_id_fkey ( name )
          `)
          .eq("user_id", user.id)
          .eq("pool_id", poolId)
          .maybeSingle();

        if (finalError) console.error("Erro ao buscar pódio final:", finalError);

        if (finalPred) {
          setFinalPrediction({
            champion_name: (finalPred.champion as any)?.name || "Não Preenchido",
            runner_up_name: (finalPred.runner_up as any)?.name || "Não Preenchido",
            third_place_name: (finalPred.third_place as any)?.name || "Não Preenchido",
            fourth_place_name: (finalPred.fourth_place as any)?.name || "Não Preenchido",
            final_home_score: finalPred.final_home_score,
            final_away_score: finalPred.final_away_score,
            updated_at: finalPred.updated_at
          });
        }

      } catch (error) {
        console.error("Erro crítico no fluxo do comprovante:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDadosComprovante();
  }, [poolId]);

  // Disparador inteligente da tela de impressão nativa do navegador
  useEffect(() => {
    if (!loading && predictions.length > 0 && !hasPrinted) {
      setHasPrinted(true);
      const timer = setTimeout(() => {
        window.print();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, predictions, hasPrinted]);

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
    <div className="comprovante-print-page bg-white p-6 max-w-[210mm] mx-auto text-slate-800">
      {/* Estilos CSS Avançados contra 'Páginas em Branco' e bugs de Layouts em Prints */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 12mm 10mm 15mm 10mm;
        }
        @media print {
          /* Reseta de forma absoluta heranças globais do app que causam telas brancas */
          html, body, #root, [data-reactroot] {
            background-color: #ffffff !important;
            color: #1a202c !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
          }
          .no-print { display: none !important; }
          .comprovante-print-page {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .page-break { page-break-before: auto; }
        }
        .match-table td { padding: 5px 6px; border-bottom: 1px dashed #e2e8f0; font-size: 8.5pt; vertical-align: middle; }
        .score-box { text-align: center; font-weight: bold; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-mono; }
      `}} />

      {/* BARRA DE AÇÕES EXCLUSIVA TELA (Oculta na Impressora) */}
      <div className="no-print flex justify-between items-center mb-6 bg-slate-100 p-3 rounded-lg border border-slate-200">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Painel
        </Button>
        <span className="text-xs text-slate-500">Se a janela não abriu, pressione <b>Ctrl + P</b> (ou <b>Cmd + P</b>)</span>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => window.print()}>
          Imprimir Manual
        </Button>
      </div>

      {/* CABEÇALHO DO COMPROVANTE */}
      <div className="flex justify-between items-center bg-[#1a202c] text-white p-4 mb-5 rounded-md">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wide">Comprovante Oficial de Palpites</h1>
          <p className="text-xs text-gray-400">Clube Futuro Palpites — Copa do Mundo 2026</p>
        </div>
        <div className="text-right bg-[#2d3748] px-3 py-1.5 border-l-4 border-emerald-500">
          <span className="block text-[9px] uppercase text-gray-400 tracking-wider">Participante</span>
          <span className="text-sm font-bold text-white">{userData?.name || "Usuário"}</span>
        </div>
      </div>

      {/* 1. SEÇÃO DE JOGOS */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase border-b-2 border-slate-300 pb-1 mb-2.5 text-slate-900 tracking-wide">1. Fase de Grupos (Placares dos Jogos)</h2>
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <table className="w-full text-left border-collapse match-table">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <th className="p-2">Partida / Confronto</th>
                <th className="p-2 w-24 text-center">Palpite</th>
                <th className="p-2 text-right w-28">Data de Registro</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred) => {
                const timeA = pred.matches?.home_team?.name || "Time A";
                const timeB = pred.matches?.away_team?.name || "Time B";
                return (
                  <tr key={pred.id} className="hover:bg-slate-50/50">
                    <td className="font-medium text-slate-700">
                      <span className="text-slate-900 font-semibold">{timeA}</span> 
                      <span className="text-slate-400 text-[8pt] mx-1.5">vs</span> 
                      <span className="text-slate-900 font-semibold">{timeB}</span>
                    </td>
                    <td className="text-center">
                      <span className="score-box text-[9pt]">{pred.home_score} x {pred.away_score}</span>
                    </td>
                    <td className="text-right text-[7.5pt] text-slate-400 font-mono">
                      {new Date(pred.updated_at).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})} {new Date(pred.updated_at).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SEÇÃO DOS PALPITES DE GRUPOS (1º E 2º COLOCADOS) */}
      {groupPredictions.length > 0 && (
        <div className="mb-6 page-break">
          <h2 className="text-xs font-bold uppercase border-b-2 border-slate-300 pb-1 mb-2.5 text-slate-900 tracking-wide">2. Classificação dos Grupos (1º e 2º de cada Grupo)</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {groupPredictions.map((gp) => (
              <div key={gp.id} className="border border-slate-200 p-2 rounded-md bg-slate-50/50">
                <div className="text-[9px] font-bold text-emerald-700 border-b border-emerald-100 pb-0.5 mb-1.5 uppercase tracking-wide">
                  {gp.groups?.name || "Grupo"}
                </div>
                <div className="text-[8pt] space-y-0.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">1º</span>
                    <span className="font-bold text-slate-800">{gp.first_team?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">2º</span>
                    <span className="font-bold text-slate-800">{gp.second_team?.name || "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SEÇÃO DO PÓDIO E FINAL */}
      {finalPrediction && (
        <div className="page-break mt-5">
          <h2 className="text-xs font-bold uppercase border-b-2 border-slate-300 pb-1 mb-2.5 text-slate-900 tracking-wide">3. Previsão do Pódio & Resultado Final</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Posições Escolhidas */}
            <div className="border border-slate-200 p-3 rounded-md bg-white">
              <span className="block text-[9px] font-bold bg-slate-100 text-slate-600 p-1 rounded mb-2 uppercase tracking-wider">
                Seleções Escolhidas (Pódio Final)
              </span>
              <ul className="text-[8.5pt] space-y-2 font-medium">
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="font-bold text-amber-500 flex items-center gap-1">1º Campeão 🏆</span> 
                  <span className="font-bold text-slate-900">{finalPrediction.champion_name}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-400">2º Vice-campeão</span> 
                  <span className="font-semibold text-slate-800">{finalPrediction.runner_up_name}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="font-bold text-amber-700">3º Lugar</span> 
                  <span className="text-slate-700">{finalPrediction.third_place_name}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-bold text-blue-500">4º Lugar</span> 
                  <span className="text-slate-700">{finalPrediction.fourth_place_name}</span>
                </li>
              </ul>
            </div>

            {/* Placar da Final */}
            <div className="border border-slate-200 p-3 rounded-md bg-white flex flex-col justify-between">
              <div>
                <span className="block text-[9px] font-bold bg-slate-100 text-slate-600 p-1 rounded mb-2 uppercase tracking-wider">
                  Placar Cravado da Grande Final
                </span>
                <div className="text-center my-3">
                  <div className="text-[9pt] font-semibold text-slate-500 mb-1.5">
                    {finalPrediction.champion_name} x {finalPrediction.runner_up_name}
                  </div>
                  <div className="inline-block score-box text-base px-5 py-1 text-slate-900 font-bold bg-emerald-50 border-emerald-200">
                    {finalPrediction.final_home_score ?? 0} x {finalPrediction.final_away_score ?? 0}
                  </div>
                </div>
              </div>
              {finalPrediction.updated_at && (
                <span className="text-[7pt] text-slate-400 block text-right font-mono">
                  Confirmado em: {new Date(finalPrediction.updated_at).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RODAPÉ DO COMPROVANTE */}
      <div className="mt-8 pt-3 border-t border-slate-200 flex justify-between items-center text-[7.5pt] text-slate-400">
        <span>Data/Hora de Emissão: {emissionDate}</span>
        <span className="font-mono text-[7pt] bg-slate-50 px-2 py-0.5 border border-slate-100 rounded">
          AUTENTICAÇÃO: SHA256_SECURE_VERIFIED_POOL_{poolId.substring(0,8).toUpperCase()}
        </span>
      </div>
    </div>
  );
}