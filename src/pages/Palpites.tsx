// src/pages/Palpites.tsx
import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Match, Team } from "@/types/matches";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt';

interface LocalPrediction {
  match_id: string;
  home_score: string;
  away_score: string;
  prediction_id?: string;
}

interface GroupPredictionState {
  group_id: string;
  predicted_first_team_id: string | null;
  predicted_second_team_id: string | null;
  prediction_id?: string;
}

interface FinalPredictionState {
  champion_id: string | null;
  vice_champion_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  prediction_id?: string;
}

const Palpites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
  const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
    champion_id: null,
    vice_champion_id: null,
    third_place_id: null,
    fourth_place_id: null,
    final_home_score: null,
    final_away_score: null,
  });

  const globalPredictionCutoffDate = parseISO("2026-06-12T12:00:00-03:00");
  const finalPredictionCutoffDate = parseISO("2026-07-01T12:00:00-03:00");

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .order('match_date', { ascending: true });
      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      if (user) {
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('user_id', user.id);
        if (predictionsError) throw predictionsError;

        const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
        (predictionsData || []).forEach(p => {
          loadedPredictions[p.match_id] = {
            match_id: p.match_id,
            home_score: p.home_score !== null ? p.home_score.toString() : '',
            away_score: p.away_score !== null ? p.away_score.toString() : '',
            prediction_id: p.id,
          };
        });
        setDailyPredictions(loadedPredictions);
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('name', { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      if (user) {
        const { data: groupPredData, error: groupPredError } = await supabase
          .from('group_predictions')
          .select('*')
          .eq('user_id', user.id);
        if (groupPredError) throw groupPredError;

        const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
        (groupPredData || []).forEach(gp => {
          loadedGroupPredictions[gp.group_id] = {
            group_id: gp.group_id,
            predicted_first_team_id: gp.predicted_first_team_id,
            predicted_second_team_id: gp.predicted_second_team_id,
            prediction_id: gp.id,
          };
        });
        setGroupPredictions(loadedGroupPredictions);
      }

      if (user) {
        const { data: finalPredData, error: finalPredError } = await supabase
          .from('final_predictions')
          .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
          .eq('user_id', user.id)
          .single();

        if (finalPredError && finalPredError.code !== 'PGRST116') {
          throw finalPredError;
        }
        if (finalPredData) {
          setFinalPrediction({
            champion_id: finalPredData.champion_id,
            vice_champion_id: finalPredData.vice_champion_id,
            third_place_id: finalPredData.third_place_id,
            fourth_place_id: finalPredData.fourth_place_id,
            final_home_score: finalPredData.final_home_score,
            final_away_score: finalPredData.final_away_score,
            prediction_id: finalPredData.id,
          });
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleScoreChange = useCallback((matchId: string, type: 'home' | 'away', value: string) => {
    setDailyPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { match_id: matchId, home_score: '', away_score: '' }),
        [type === 'home' ? 'home_score' : 'away_score']: value,
      }
    }));
  }, []);

  const handleGroupTeamChange = useCallback((groupId: string, type: 'first' | 'second', teamId: string) => {
    setGroupPredictions(prev => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || { group_id: groupId, predicted_first_team_id: null, predicted_second_team_id: null }),
        [type === 'first' ? 'predicted_first_team_id' : 'predicted_second_team_id']: teamId || null,
      }
    }));
  }, []);

  const handleFinalPredictionChange = useCallback((field: keyof FinalPredictionState, value: string | number | null) => {
    setFinalPrediction(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSaveDailyPrediction = async (matchId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite.");
      return;
    }

    const prediction = dailyPredictions[matchId];
    if (!prediction || prediction.home_score.trim() === "" || prediction.away_score.trim() === "") {
      toast.error("Por favor, preencha ambos os placares para o palpite.");
      return;
    }

    const homeScoreNum = parseInt(prediction.home_score, 10);
    const awayScoreNum = parseInt(prediction.away_score, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast.error("Os placares devem ser números válidos e não negativos.");
      return;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) {
      toast.error("Partida não encontrada.");
      return;
    }

    const matchDate = parseISO(match.match_date);
    if (matchDate.getTime() <= Date.now()) {
      toast.error("O prazo para palpites desta partida já encerrou.");
      return;
    }

    setSubmittingMatchId(matchId);
    try {
      let data, error;
      const payload = {
        match_id: matchId,
        user_id: user.id,
        home_score: homeScoreNum,
        away_score: awayScoreNum,
      };

      if (prediction.prediction_id) {
        ({ data, error } = await supabase
          .from('match_predictions')
          .update({
            home_score: payload.home_score,
            away_score: payload.away_score,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('match_predictions')
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw error;

      if (data) {
        setDailyPredictions(prev => ({
          ...prev,
          [matchId]: { ...prev[matchId], prediction_id: data.id }
        }));
      }
      toast.success("Palpite salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar palpite:", error);
      toast.error(`Erro ao salvar palpite: ${error.message || error.toString()}`);
    } finally {
      setSubmittingMatchId(null);
    }
  };

  const handleSubmitBets = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para confirmar os palpites.");
      return;
    }
    setSubmitting(true);

    const predictionsToUpsert = Object.values(dailyPredictions)
      .filter(p => {
        const match = matches.find(m => m.id === p.match_id);
        const canPredict = match && parseISO(match.match_date).getTime() > Date.now();
        if (!canPredict) return false;

        if (p.prediction_id) return true; // Palpites existentes são incluídos se o prazo não passou

        // Para novos palpites, os scores devem ser válidos
        const homeScoreNum = parseInt(p.home_score, 10);
        const awayScoreNum = parseInt(p.away_score, 10);
        const homeScoreValid = p.home_score.trim() !== "" && !isNaN(homeScoreNum) && homeScoreNum >= 0;
        const awayScoreValid = p.away_score.trim() !== "" && !isNaN(awayScoreNum) && awayScoreNum >= 0;
        return homeScoreValid && awayScoreValid;
      })
      .map(p => {
        const homeScoreNum = parseInt(p.home_score, 10);
        const awayScoreNum = parseInt(p.away_score, 10);

        // Se as colunas no DB forem NOT NULL e um score for inválido (NaN),
        // precisamos decidir o que enviar. Ex: 0 ou não enviar o palpite.
        // Aqui, assumimos que o filtro já cuidou dos novos palpites.
        // Para palpites existentes, se o usuário apagar um score, resultará em NaN.
        // Se as colunas do DB forem NOT NULL, isso causará erro.
        // Se forem NULLABLE, JSON.stringify(NaN) vira null, o que pode ser aceitável.
        
        // Exemplo de tratamento para scores NaN (ajuste conforme a lógica de negócio e schema do DB):
        // Se as colunas de score no DB são NOT NULL:
        const finalHomeScore = isNaN(homeScoreNum) ? (p.prediction_id ? 0 : undefined) : homeScoreNum;
        const finalAwayScore = isNaN(awayScoreNum) ? (p.prediction_id ? 0 : undefined) : awayScoreNum;
        
        // Se um palpite existente ficou com scores inválidos (NaN) e as colunas são NOT NULL,
        // ou você envia um default (como 0), ou impede o envio (ajustando o filtro),
        // ou torna as colunas NULLABLE no DB e envia null.
        if (p.prediction_id && (finalHomeScore === undefined || finalAwayScore === undefined)) {
            console.warn(`Palpite existente ${p.prediction_id} para partida ${p.match_id} com scores inválidos ('${p.home_score}', '${p.away_score}'). Verifique a lógica ou permita scores nulos no DB.`);
            // Poderia retornar null aqui e filtrar depois para não enviar este palpite,
            // ou ajustar a UI para não permitir limpar scores de palpites existentes se eles são NOT NULL.
        }


        return {
          ...(p.prediction_id && { id: p.prediction_id }),
          match_id: p.match_id,
          user_id: user.id,
          home_score: finalHomeScore,
          away_score: finalAwayScore,
        };
      })
      // .filter(Boolean); // Adicionar se você retornar null no map para palpites problemáticos

    if (predictionsToUpsert.length === 0) {
      toast.info("Nenhum palpite válido para salvar/atualizar ou todos os prazos encerraram.");
      setSubmitting(false);
      return;
    }
    
    // Log do payload antes de enviar
    console.log("Payload para upsert (handleSubmitBets):", JSON.stringify(predictionsToUpsert, null, 2));

    try {
      const { error } = await supabase
        .from('match_predictions')
        .upsert(predictionsToUpsert, { onConflict: 'user_id, match_id' });

      if (error) {
        // Log detalhado do erro do Supabase
        console.error("Erro detalhado do Supabase ao salvar palpites:", error);
        throw error;
      }

      toast.success("Palpites das partidas salvos/atualizados com sucesso!");
      await fetchInitialData(); // Recarrega os dados, incluindo os prediction_ids atualizados
    } catch (error: any) {
      console.error("Erro ao salvar palpites das partidas:", error);
      toast.error(`Erro ao salvar palpites das partidas: ${error.details || error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGroupPrediction = useCallback(async (groupId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite de grupo.");
      return;
    }
    if (globalPredictionCutoffDate.getTime() <= Date.now()) {
      toast.error("O prazo para palpites de grupo já encerrou.");
      return;
    }
    const prediction = groupPredictions[groupId];
    if (!prediction || !prediction.predicted_first_team_id || !prediction.predicted_second_team_id) {
      toast.error("Por favor, selecione os dois times classificados para o grupo.");
      return;
    }
    if (prediction.predicted_first_team_id === prediction.predicted_second_team_id) {
      toast.error("Os times do 1º e 2º lugar não podem ser os mesmos.");
      return;
    }
    setSubmitting(true);
    try {
      let data, error;
      const payload = {
        group_id: groupId,
        user_id: user.id,
        predicted_first_team_id: prediction.predicted_first_team_id,
        predicted_second_team_id: prediction.predicted_second_team_id,
      };
      if (prediction.prediction_id) {
        ({ data, error } = await supabase
          .from('group_predictions')
          .update({
            predicted_first_team_id: payload.predicted_first_team_id,
            predicted_second_team_id: payload.predicted_second_team_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select().single());
      } else {
        ({ data, error } = await supabase
          .from('group_predictions')
          .insert(payload)
          .select().single());
      }
      if (error) throw error;
      
      if(data) {
        setGroupPredictions(prev => ({
          ...prev,
          [groupId]: { ...prev[groupId], prediction_id: data.id }
        }));
      }
      toast.success(`Palpite do grupo ${groups.find(g => g.id === groupId)?.name || ''} salvo com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao salvar palpite de grupo:", error);
      toast.error(`Erro ao salvar palpite de grupo: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }, [user, groupPredictions, groups, globalPredictionCutoffDate, fetchInitialData]); // Removido fetchInitialData daqui, pois ele é chamado no useEffect principal

  const handleSaveFinalPrediction = useCallback(async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite da final.");
      return;
    }
    if (finalPredictionCutoffDate.getTime() <= Date.now()) {
      toast.error("O prazo para palpites da final já encerrou.");
      return;
    }
    if (!finalPrediction.champion_id || !finalPrediction.vice_champion_id ||
        !finalPrediction.third_place_id || !finalPrediction.fourth_place_id ||
        finalPrediction.final_home_score === null || finalPrediction.final_away_score === null ||
        finalPrediction.final_home_score < 0 || finalPrediction.final_away_score < 0 ) {
      toast.error("Por favor, preencha todos os campos do palpite da final (Campeão, Vice-Campeão, 3º lugar, 4º lugar e Placar com valores não negativos).");
      return;
    }
    const finalTeams = [
      finalPrediction.champion_id,
      finalPrediction.vice_champion_id,
      finalPrediction.third_place_id,
      finalPrediction.fourth_place_id
    ];
    const uniqueTeams = new Set(finalTeams);
    if (uniqueTeams.size !== 4) {
      toast.error("Os times do 1º, 2º, 3º e 4º lugar devem ser diferentes.");
      return;
    }
    setSubmitting(true);
    try {
      const payloadToUpsert = {
        user_id: user.id,
        champion_id: finalPrediction.champion_id,
        vice_champion_id: finalPrediction.vice_champion_id,
        third_place_id: finalPrediction.third_place_id,
        fourth_place_id: finalPrediction.fourth_place_id,
        final_home_score: finalPrediction.final_home_score,
        final_away_score: finalPrediction.final_away_score,
        ...(finalPrediction.prediction_id && { id: finalPrediction.prediction_id })
      };

      const { data, error } = await supabase
        .from('final_predictions')
        .upsert(payloadToUpsert, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setFinalPrediction(prev => ({
            ...prev,
            prediction_id: data.id
        }));
      }
      toast.success("Palpite da final salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar palpite final:", error);
      toast.error(`Erro ao salvar palpite final: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }, [user, finalPrediction, finalPredictionCutoffDate, fetchInitialData]); // Removido fetchInitialData

  const handlePrintReceipt = useCallback(() => {
    if (!user) {
      toast.error("Você precisa estar logado para gerar o comprovante.");
      return;
    }

    const userMatchPredictionsForReceipt = Object.values(dailyPredictions)
      .map(p => {
        const match = matches.find(m => m.id === p.match_id);
        if (!match) return null;
        
        const homeScoreNum = parseInt(p.home_score, 10);
        const awayScoreNum = parseInt(p.away_score, 10);

        if (p.home_score.trim() === "" || p.away_score.trim() === "" || isNaN(homeScoreNum) || isNaN(awayScoreNum)) return null;

        const homeTeamData = teams.find(t => t.id === match.home_team_id);
        const awayTeamData = teams.find(t => t.id === match.away_team_id);

        return {
          match: {
            id: match.id,
            match_date: match.match_date,
            stage: match.stage,
            home_team: homeTeamData || { id: `unknown_home_${match.home_team_id || 'id_not_found'}`, name: (homeTeamData as Team)?.name || 'A Definir', flag_url: (homeTeamData as Team)?.flag_url || '' },
            away_team: awayTeamData || { id: `unknown_away_${match.away_team_id || 'id_not_found'}`, name: (awayTeamData as Team)?.name || 'A Definir', flag_url: (awayTeamData as Team)?.flag_url || '' },
          },
          home_score_prediction: homeScoreNum,
          away_score_prediction: awayScoreNum,
        };
      }).filter(p => p !== null);

    const userGroupPredictionsForReceipt = Object.values(groupPredictions)
      .filter(gp => gp.predicted_first_team_id && gp.predicted_second_team_id)
      .map(gp => {
        const group = groups.find(g => g.id === gp.group_id);
        if (!group) return null;

        const firstTeamData = teams.find(t => t.id === gp.predicted_first_team_id);
        const secondTeamData = teams.find(t => t.id === gp.predicted_second_team_id);

        return {
          group_name: group.name,
          predicted_first_team: firstTeamData || { id: `unknown_first_${gp.predicted_first_team_id || 'id_not_found'}`, name: (firstTeamData as Team)?.name || 'Não Definido', flag_url: (firstTeamData as Team)?.flag_url || '' },
          predicted_second_team: secondTeamData || { id: `unknown_second_${gp.predicted_second_team_id || 'id_not_found'}`, name: (secondTeamData as Team)?.name || 'Não Definido', flag_url: (secondTeamData as Team)?.flag_url || '' },
        };
      }).filter(Boolean);

    const finalChampionData = teams.find(t => t.id === finalPrediction.champion_id);
    const finalViceChampionData = teams.find(t => t.id === finalPrediction.vice_champion_id);
    const finalThirdPlaceData = teams.find(t => t.id === finalPrediction.third_place_id);
    const finalFourthPlaceData = teams.find(t => t.id === finalPrediction.fourth_place_id);

    const finalPredictionReceipt = {
      champion: finalChampionData || { id: 'unknown_champ', name: (finalChampionData as Team)?.name || 'Não Definido', flag_url: (finalChampionData as Team)?.flag_url || '' },
      vice_champion: finalViceChampionData || { id: 'unknown_vice', name: (finalViceChampionData as Team)?.name || 'Não Definido', flag_url: (finalViceChampionData as Team)?.flag_url || '' },
      third_place: finalThirdPlaceData || { id: 'unknown_third', name: (finalThirdPlaceData as Team)?.name || 'Não Definido', flag_url: (finalThirdPlaceData as Team)?.flag_url || '' },
      fourth_place: finalFourthPlaceData || { id: 'unknown_fourth', name: (finalFourthPlaceData as Team)?.name || 'Não Definido', flag_url: (finalFourthPlaceData as Team)?.flag_url || '' },
      final_home_score: finalPrediction.final_home_score,
      final_away_score: finalPrediction.final_away_score,
    };
    
    if (userMatchPredictionsForReceipt.length === 0 && userGroupPredictionsForReceipt.length === 0 && (!finalPrediction.champion_id || !finalPrediction.vice_champion_id)) {
        toast.info("Nenhum palpite completo para gerar o comprovante.");
        return;
    }

    const dateGenerated = new Date();

    const receiptHtml = ReactDOMServer.renderToString(
      <PredictionReceipt
        user={user}
        predictions={userMatchPredictionsForReceipt as any}
        groupPredictions={userGroupPredictionsForReceipt as any}
        finalPrediction={finalPredictionReceipt as any}
        dateGenerated={dateGenerated}
      />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprovante de Palpites</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print { 
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              } 
              .print-only { display: block !important; } 
              .no-print { display: none !important; } 
              .bg-white, .bg-gray-50 { background-color: #ffffff !important; } 
              .border-gray-200 { border-color: #e5e7eb !important; } 
            } 
            body { 
              font-family: Verdana, sans-serif;
              font-size: 9pt;
              margin: 20px;
            }
            h1 { font-size: 14pt; font-weight: bold; margin-bottom: 10px; }
            h2 { font-size: 11pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 3px;}
            p { margin-bottom: 4px; line-height: 1.4; }
            .font-medium { font-weight: 600; }
            .text-sm { font-size: 8pt; }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }, [user, dailyPredictions, matches, teams, groupPredictions, groups, finalPrediction]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">Meus Palpites</h1>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="daily">Partidas</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
            <TabsTrigger value="final">Final</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpites das Partidas</CardTitle>
                <CardDescription>
                  Preencha seus placares para cada partida. O prazo para palpitar em uma partida encerra no horário do jogo.
                  Use o botão "Confirmar Palpites da Aba Partidas" abaixo da lista para salvar todos os seus palpites desta aba.
                  Se um palpite já foi salvo, um botão "Atualizar" aparecerá ao lado da partida para alterações rápidas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matches.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhuma partida encontrada.</p>
                ) : (
                  matches.map(match => {
                    const matchDate = parseISO(match.match_date);
                    const canPredict = matchDate.getTime() > Date.now();
                    const prediction = dailyPredictions[match.id] || { match_id: match.id, home_score: '', away_score: '' };

                    return (
                      <Card key={match.id} className={`p-4 ${!canPredict ? 'bg-gray-100 opacity-80' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-lg font-semibold">{(match.home_team as Team)?.name || 'A Definir'} vs {(match.away_team as Team)?.name || 'A Definir'}</p>
                            <p className="text-sm text-gray-600">{format(matchDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                          </div>
                          {!canPredict && (
                            <span className="text-red-500 font-semibold text-sm">Prazo encerrado</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-16 text-center"
                            placeholder="0"
                            value={prediction.home_score}
                            onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                            disabled={submitting || submittingMatchId === match.id || !canPredict}
                          />
                          <span className="text-xl font-bold">x</span>
                          <Input
                            type="number"
                            min="0"
                            className="w-16 text-center"
                            placeholder="0"
                            value={prediction.away_score}
                            onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                            disabled={submitting || submittingMatchId === match.id || !canPredict}
                          />
                          {prediction.prediction_id && canPredict && (
                            <Button
                              className="ml-auto bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleSaveDailyPrediction(match.id)}
                              disabled={submittingMatchId === match.id || submitting}
                            >
                              {submittingMatchId === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpites dos Grupos</CardTitle>
                <CardDescription>
                  Selecione os dois times que você acredita que se classificarão em 1º e 2º lugar em cada grupo.
                  O prazo para palpites de grupo encerra em: {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groups.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhum grupo encontrado.</p>
                ) : (
                  groups.map(group => {
                    const groupPrediction = groupPredictions[group.id] || { group_id: group.id, predicted_first_team_id: null, predicted_second_team_id: null };
                    const canPredictGroup = globalPredictionCutoffDate.getTime() > Date.now();
                    const filteredTeams = teams.filter(team => team.group_id === group.id);

                    return (
                      <Card key={group.id} className={`p-4 ${!canPredictGroup ? 'bg-gray-100 opacity-80' : ''}`}>
                        <h3 className="text-lg font-semibold mb-2">Grupo {group.name}</h3>
                        {!canPredictGroup && (
                          <p className="text-red-500 font-semibold text-sm mb-2">Prazo encerrado</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`first-${group.id}`}>1º Lugar:</Label>
                            <Select
                              value={groupPrediction.predicted_first_team_id || ''}
                              onValueChange={(value) => handleGroupTeamChange(group.id, 'first', value)}
                              disabled={submitting || !canPredictGroup}
                            >
                              <SelectTrigger id={`first-${group.id}`}>
                                <SelectValue placeholder="Selecione o 1º lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    <div className="flex items-center">
                                      {team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback></Avatar>}
                                      {team.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`second-${group.id}`}>2º Lugar:</Label>
                            <Select
                              value={groupPrediction.predicted_second_team_id || ''}
                              onValueChange={(value) => handleGroupTeamChange(group.id, 'second', value)}
                              disabled={submitting || !canPredictGroup}
                            >
                              <SelectTrigger id={`second-${group.id}`}>
                                <SelectValue placeholder="Selecione o 2º lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    <div className="flex items-center">
                                      {team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback></Avatar>}
                                      {team.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          className="mt-4 bg-fifa-green hover:bg-green-700"
                          onClick={() => handleSaveGroupPrediction(group.id)}
                          disabled={submitting || !canPredictGroup}
                        >
                          {groupPrediction.prediction_id ? "Atualizar Palpite" : "Salvar Palpite"}
                        </Button>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpite da Fase Final</CardTitle>
                <CardDescription>
                  Preencha seus palpites para o Campeão, Vice-Campeão, 3º lugar, 4º lugar e o placar da final.
                  O prazo para palpites da final encerra em: {format(finalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!teams.length ? (
                  <p className="text-center text-gray-500">Carregando times...</p>
                ) : (
                  <div className="space-y-4">
                    {!(finalPredictionCutoffDate.getTime() > Date.now()) && (
                      <Alert className="bg-red-50 border-red-200 text-red-700">
                        <AlertTitle>Prazo encerrado!</AlertTitle>
                        <AlertDescription>Você não pode mais alterar seu palpite da final.</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="champion-select">Campeão:</Label>
                        <Select
                          value={finalPrediction.champion_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('champion_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="champion-select"><SelectValue placeholder="Selecione o Campeão" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vice-champion-select">Vice-Campeão:</Label>
                        <Select
                          value={finalPrediction.vice_champion_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('vice_champion_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="vice-champion-select"><SelectValue placeholder="Selecione o Vice-Campeão" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="third-place-select">3º Lugar:</Label>
                        <Select
                          value={finalPrediction.third_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('third_place_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="third-place-select"><SelectValue placeholder="Selecione o 3º Lugar" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fourth-place-select">4º Lugar:</Label>
                        <Select
                          value={finalPrediction.fourth_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('fourth_place_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="fourth-place-select"><SelectValue placeholder="Selecione o 4º Lugar" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="final-score">Placar da Final (Campeão x Vice):</Label>
                      <div className="flex items-center gap-2">
                        <Input id="final-home-score" type="number" min="0" className="w-24 text-center" placeholder="0" value={finalPrediction.final_home_score === null ? '' : finalPrediction.final_home_score.toString()} onChange={(e) => handleFinalPredictionChange('final_home_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())} />
                        <span className="text-xl font-bold">x</span>
                        <Input id="final-away-score" type="number" min="0" className="w-24 text-center" placeholder="0" value={finalPrediction.final_away_score === null ? '' : finalPrediction.final_away_score.toString()} onChange={(e) => handleFinalPredictionChange('final_away_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())} />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-fifa-green hover:bg-green-700"
                      onClick={handleSaveFinalPrediction}
                      disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                    >
                      {finalPrediction.prediction_id ? "Atualizar Palpite da Final" : "Salvar Palpite da Final"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">
            <Button
              className="w-full bg-fifa-blue hover:bg-opacity-90"
              onClick={handleSubmitBets}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Palpites da Aba Partidas
            </Button>
            <Button
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              onClick={handlePrintReceipt}
              disabled={submitting || !user }
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Comprovante
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Atenção: O botão "Confirmar Palpites da Aba Partidas" salva todos os seus palpites preenchidos na aba de Partidas. Para Grupos e Final, use os botões "Salvar/Atualizar Palpite" específicos de cada seção.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;