// src/pages/Simulador.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { calculateGroupStandings, SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import SimulatedGroupTables from '@/components/simulation/SimulatedGroupTables';
import KnockoutBracket from '@/components/simulation/KnockoutBracket';
import { isAfter } from 'date-fns';

interface Team {
  id: string;
  name: string;
  group_id: string;
}

const Simulador = () => {
  const { user, activePool: pool } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<SimulatedGroup[] | null>(null);
  const [allTeams, setAllTeams] = useState<SimulatedTeamStats[]>([]);
  const [knockoutSelections, setKnockoutSelections] = useState<{ [matchId: string]: string }>({});
  
  // Novo estado que armazena os jogos já agrupados
  const [groupedMatches, setGroupedMatches] = useState<{group: string, matches: any[]}[]>([]);

  const isDeadlinePassed = pool?.prediction_deadline
    ? isAfter(new Date(), new Date(pool.prediction_deadline))
    : false;

  useEffect(() => {
    // Busca e Agrupa os Jogos para Impressão
    const fetchMatchesForPrint = async () => {
      const poolWithChamp = pool as any;
      if (!poolWithChamp?.championship_id) return;

      const [matchesRes, teamsRes, groupsRes] = await Promise.all([
        supabase
          .from('matches')
          .select('*')
          .eq('championship_id', poolWithChamp.championship_id)
          .order('match_date', { ascending: true }),
        supabase.from('teams').select('id, name, group_id'),
        supabase.from('groups').select('id, name')
      ]);

      if (matchesRes.data && teamsRes.data && groupsRes.data) {
        const groupsMap = new Map(groupsRes.data.map(g => [g.id, g.name]));
        const teamsMap = new Map(teamsRes.data.map(t => [t.id, t]));
        
        // 1. Formata e descobre de qual grupo é a partida
        const formatted = matchesRes.data.map(m => {
          const homeTeam = teamsMap.get(m.home_team_id);
          const awayTeam = teamsMap.get(m.away_team_id);
          
          let groupName = 'Mata-Mata / Outros';
          if (homeTeam && homeTeam.group_id) {
             groupName = groupsMap.get(homeTeam.group_id) || groupName;
          }

          // Formatar a data (DD/MM HH:MM)
          const dateObj = new Date(m.match_date);
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          const formattedDate = `${day}/${month} ${hours}:${minutes}`;

          return {
            ...m,
            home_team: { name: homeTeam?.name || 'A Definir' },
            away_team: { name: awayTeam?.name || 'A Definir' },
            group_name: groupName,
            formatted_date: formattedDate
          };
        });

        // 2. Agrupa pelo nome do grupo
        const groupedObj = formatted.reduce((acc: any, match: any) => {
           if (!acc[match.group_name]) acc[match.group_name] = [];
           acc[match.group_name].push(match);
           return acc;
        }, {});

        // 3. Converte para array e organiza alfabeticamente (Grupo A, Grupo B...)
        const groupedArray = Object.keys(groupedObj)
           .sort() 
           .map(key => ({
               group: key,
               matches: groupedObj[key]
           }));

        setGroupedMatches(groupedArray);
      }
    };

    if (pool) fetchMatchesForPrint();
  }, [pool]);

  const handleSimulation = async () => {
    if (!user || !pool) return toast.error('Você precisa estar logado para simular.');
    setIsLoading(true);
    setSimulatedResults(null);
    setKnockoutSelections({}); 
    try {
      const [{ data: predictionsQueryData, error: pError }, { data: teamsData, error: tError }, { data: groupsData, error: gError }] = await Promise.all([
        supabase.from('match_predictions')
          .select('home_score, away_score, matches!inner(home_team_id, away_team_id)')
          .eq('user_id', user.id)
          .eq('pool_id', pool.id),
        supabase.from('teams').select('id, name, group_id'),
        supabase.from('groups').select('id, name')
      ]);

      if (pError || tError || gError) throw pError || tError || gError;
      
      if (!predictionsQueryData || predictionsQueryData.length === 0) {
        toast.warning("Você ainda não possui palpites salvos neste bolão! Imprima a folha ao lado ou faça seus palpites no sistema primeiro.");
        setIsLoading(false);
        return;
      }

      const formattedPredictions = predictionsQueryData.map(p => ({
        home_score: p.home_score,
        away_score: p.away_score,
        home_team_id: p.matches.home_team_id,
        away_team_id: p.matches.away_team_id,
      }));

      const results = calculateGroupStandings(formattedPredictions, teamsData as Team[] || [], groupsData || []);
      setSimulatedResults(results);
      setAllTeams(results.flatMap(g => g.standings));
      toast.success("Simulação concluída! Agora preencha o mata-mata.");

    } catch (error: any) {
      console.error("Erro na simulação:", error);
      toast.error("Ocorreu um erro ao realizar a simulação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKnockoutSelection = useCallback((matchId: string, teamId: string | null) => {
    setKnockoutSelections(prev => {
      const newState = { ...prev };
      if (teamId) newState[matchId] = teamId;
      else delete newState[matchId];
      
      const cascadeClearMap: { [key: string]: string[] } = {
        'r16-1': ['qf-1', 'sf-1', 'final', 'third_place'], 'r16-2': ['qf-1', 'sf-1', 'final', 'third_place'],
        'r16-3': ['qf-2', 'sf-1', 'final', 'third_place'], 'r16-4': ['qf-2', 'sf-1', 'final', 'third_place'],
        'r16-5': ['qf-3', 'sf-2', 'final', 'third_place'], 'r16-6': ['qf-3', 'sf-2', 'final', 'third_place'],
        'r16-7': ['qf-4', 'sf-2', 'final', 'third_place'], 'r16-8': ['qf-4', 'sf-2', 'final', 'third_place'],
        'qf-1': ['sf-1', 'final', 'third_place'], 'qf-2': ['sf-1', 'final', 'third_place'],
        'qf-3': ['sf-2', 'final', 'third_place'], 'qf-4': ['sf-2', 'final', 'third_place'],
        'sf-1': ['final', 'third_place'], 'sf-2': ['final', 'third_place'],
      };
      const downstreamMatchesToClear = cascadeClearMap[matchId as keyof typeof cascadeClearMap];
      if (downstreamMatchesToClear) downstreamMatchesToClear.forEach(idToClear => { delete newState[idToClear]; });
      return newState;
    });
  }, []);

  const handleAdoptGroupPrediction = async (groupId: string, firstTeamId: string, secondTeamId: string) => {
    if (!user) return;
    if (firstTeamId === secondTeamId) return toast.error("Você não pode escolher o mesmo time como 1º e 2º lugar.");
    const toastId = toast.loading('Salvando palpites do grupo...');
    try {
      const { error } = await supabase.from('group_predictions').upsert({
        user_id: user.id, group_id: groupId, predicted_first_team_id: firstTeamId, predicted_second_team_id: secondTeamId,
      }, { onConflict: 'user_id, group_id' });
      if (error) throw error;
      toast.success("Palpites do grupo salvos com sucesso!", { id: toastId });
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    }
  };

  const handleAdoptFinalPredictions = async (championId: string, runnerUpId: string, thirdPlaceId: string, fourthPlaceId: string, finalHomeScore: number, finalAwayScore: number) => {
    if (!user) return;
    const toastId = toast.loading('Salvando palpites finais...');
    try {
      const { error } = await supabase.from('final_predictions').upsert({
        user_id: user.id, champion_id: championId, runner_up_id: runnerUpId, third_place_id: thirdPlaceId, fourth_place_id: fourthPlaceId, final_home_score: finalHomeScore, final_away_score: finalAwayScore,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Palpites finais salvos com sucesso!', { id: toastId });
    } catch (error: any) {
      toast.error(`Erro ao salvar palpites finais: ${error.message}`, { id: toastId });
    }
  };

  // --- FUNÇÕES DE IMPRESSÃO BLINDADAS ---
  const handlePrintBlank = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Permita os pop-ups no seu navegador para poder imprimir.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revista de Palpites</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: black; background: white; }
          .header { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 16px; color: #444; margin-top: 5px; }
          
          /* Evita quebra de página no meio de um grupo */
          .group-section { margin-bottom: 30px; page-break-inside: avoid; }
          .group-title { font-size: 16px; font-weight: 900; background: #eee; padding: 6px 12px; border: 2px solid black; border-radius: 4px; margin-bottom: 15px; display: inline-block; }
          
          .matches-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 40px; }
          .match { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #ccc; padding-bottom: 8px; }
          
          .match-date { font-size: 11px; color: #555; width: 80px; text-align: left; }
          .team { flex: 1; font-size: 13px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .team.home { text-align: right; margin-right: 10px; }
          .team.away { text-align: left; margin-left: 10px; }
          
          .score-box { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
          .box { width: 25px; height: 25px; border: 2px solid black; border-radius: 4px; }
          .x { font-weight: 900; font-size: 12px; color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Revista de Palpites - ${pool?.name || ''}</h1>
          <p class="subtitle">Folha de rascunho para a Fase de Grupos</p>
        </div>
        
        ${groupedMatches.map(g => `
          <div class="group-section">
            <div class="group-title">${g.group}</div>
            <div class="matches-grid">
              ${g.matches.map((m: any) => `
                <div class="match">
                  <span class="match-date">${m.formatted_date}</span>
                  <span class="team home">${m.home_team?.name}</span>
                  <span class="score-box">
                    <div class="box"></div>
                    <span class="x">X</span>
                    <div class="box"></div>
                  </span>
                  <span class="team away">${m.away_team?.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        
        <script>
          setTimeout(() => { window.print(); window.close(); }, 500);
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintSimulated = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Permita os pop-ups no seu navegador para poder imprimir.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chaveamento Simulado</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: black; background: white; }
          .header { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 16px; color: #444; margin-top: 5px; }
          .group-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; }
          .group-card { border: 2px solid black; padding: 10px; border-radius: 6px; font-size: 14px; }
          .group-name { font-weight: 900; background: #eee; text-align: center; margin: -10px -10px 10px -10px; padding: 5px; border-bottom: 1px solid black; }
          .team-line { font-weight: bold; margin-bottom: 5px; }
          .knockout-list { display: flex; flex-direction: column; gap: 20px; max-width: 600px; margin: 0 auto; }
          .knockout-match { display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 2px solid black; border-radius: 8px; background: #fafafa; }
          .line { width: 40%; height: 3px; background: black; }
          .x { font-size: 20px; font-weight: 900; padding: 0 15px; }
          .footer { margin-top: 40px; text-align: center; font-size: 14px; font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Chaveamento Mata-Mata</h1>
          <p class="subtitle">Baseado na sua simulação de grupos. Preencha quem avança!</p>
        </div>

        <div class="group-grid">
          ${simulatedResults?.map(g => `
            <div class="group-card">
              <div class="group-name">${g.name}</div>
              <div class="team-line">1º ${g.standings[0]?.name || ''}</div>
              <div class="team-line">2º ${g.standings[1]?.name || ''}</div>
            </div>
          `).join('')}
        </div>

        <div class="knockout-list">
          ${Array(8).fill(0).map(() => `
            <div class="knockout-match">
              <div class="line"></div>
              <div class="x">X</div>
              <div class="line"></div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          * Rascunho preenchido à mão. Lembre-se de repassar seus palpites oficiais para a plataforma antes do prazo!
        </div>
        <script>
          setTimeout(() => { window.print(); window.close(); }, 500);
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Simulador de Bolão</CardTitle>
          <CardDescription>
            Veja como ficaria a fase de grupos e o chaveamento com base nos seus palpites de jogos!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button size="lg" onClick={handleSimulation} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {isLoading ? 'Calculando...' : 'Simular Classificação'}
          </Button>
          
          <Button size="lg" variant="outline" onClick={handlePrintBlank} disabled={groupedMatches.length === 0} className="w-full sm:w-auto">
            <FileText className="mr-2 h-5 w-5" /> Imprimir Jogos (Folha Rascunho)
          </Button>
        </CardContent>
      </Card>

      {simulatedResults && (
        <div className="space-y-8">
          <div className="text-center">
            <Button variant="secondary" onClick={handlePrintSimulated}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Simulação Mata-Mata
            </Button>
          </div>
          
          <div id="simulation-group-tables">
            <SimulatedGroupTables 
              simulatedGroups={simulatedResults} 
              onAdoptPrediction={handleAdoptGroupPrediction}
              isDeadlinePassed={isDeadlinePassed}
            />
          </div>
          
          <div id="simulation-knockout-bracket" className="mt-8">
            <KnockoutBracket
              simulatedGroups={simulatedResults}
              knockoutSelections={knockoutSelections}
              onSelectionChange={handleKnockoutSelection}
              onAdoptAllFinalPredictions={handleAdoptFinalPredictions}
              allTeams={allTeams}
              isDeadlinePassed={isDeadlinePassed}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulador;