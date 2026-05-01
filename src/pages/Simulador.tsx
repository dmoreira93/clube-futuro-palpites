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
  
  const [groupedMatches, setGroupedMatches] = useState<{group: string, matches: any[]}[]>([]);

  const isDeadlinePassed = pool?.prediction_deadline
    ? isAfter(new Date(), new Date(pool.prediction_deadline))
    : false;

  useEffect(() => {
    // Busca e Agrupa os Jogos para Impressão da Folha em Branco
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
        supabase.from('groups').select('id, name').eq('championship_id', poolWithChamp.championship_id)
      ]);

      if (matchesRes.data && teamsRes.data && groupsRes.data) {
        const groupsMap = new Map(groupsRes.data.map(g => [g.id, g.name]));
        const teamsMap = new Map(teamsRes.data.map(t => [t.id, t]));
        
        const formatted = matchesRes.data.map(m => {
          const homeTeam = teamsMap.get(m.home_team_id);
          const awayTeam = teamsMap.get(m.away_team_id);
          
          let groupName = 'Mata-Mata / Outros';
          if (homeTeam && homeTeam.group_id && groupsMap.has(homeTeam.group_id)) {
             groupName = groupsMap.get(homeTeam.group_id) || groupName;
          }

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

        const groupedObj = formatted.reduce((acc: any, match: any) => {
           if (!acc[match.group_name]) acc[match.group_name] = [];
           acc[match.group_name].push(match);
           return acc;
        }, {});

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
      const poolWithChamp = pool as any;
      const champId = poolWithChamp?.championship_id;

      let groupsQuery = supabase.from('groups').select('id, name');
      if (champId) {
          groupsQuery = groupsQuery.eq('championship_id', champId);
      }

      const [{ data: predictionsQueryData, error: pError }, { data: teamsData, error: tError }, { data: groupsData, error: gError }] = await Promise.all([
        supabase.from('match_predictions')
          .select('home_score, away_score, matches!inner(home_team_id, away_team_id)')
          .eq('user_id', user.id)
          .eq('pool_id', pool.id),
        supabase.from('teams').select('id, name, group_id'), 
        groupsQuery // Traz SOMENTE os grupos deste campeonato
      ]);

      if (pError || tError || gError) throw pError || tError || gError;
      
      if (!predictionsQueryData || predictionsQueryData.length === 0) {
        toast.warning("Você ainda não possui palpites salvos neste bolão! Imprima a folha ao lado ou faça seus palpites no sistema primeiro.");
        setIsLoading(false);
        return;
      }

      // FILTRO MESTRE: Isola apenas os times que pertencem aos grupos Deste Campeonato
      const validGroupIds = new Set((groupsData || []).map(g => g.id));
      const filteredTeams = (teamsData || []).filter(t => validGroupIds.has(t.group_id));

      const formattedPredictions = predictionsQueryData.map(p => ({
        home_score: p.home_score,
        away_score: p.away_score,
        home_team_id: p.matches.home_team_id,
        away_team_id: p.matches.away_team_id,
      }));

      // Roda a simulação com as listas higienizadas
      const results = calculateGroupStandings(formattedPredictions, filteredTeams as Team[], groupsData || []);
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

  // --- FUNÇÕES DE IMPRESSÃO ---
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
          body { font-family: Arial, sans-serif; padding: 20px; color: black; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 16px; color: #444; margin-top: 5px; }
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
        
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
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

    // Extratores Seguros e Robustos para garantir que o nome apareça!
    const getGroupName = (g: any) => g?.groupName || g?.group_name || g?.name || g?.group?.name || 'Grupo';
    const getTeamName = (t: any) => t?.teamName || t?.team_name || t?.name || t?.team?.name || 'A Definir';

    // Função que resgata automaticamente o classificado do grupo pela letra
    const getTeamByLetter = (letter: string, pos: number) => {
        const group: any = simulatedResults?.find((g: any) => {
            const name = getGroupName(g).toUpperCase().trim();
            // Identifica se é "GRUPO A", "A", "GROUP A", etc.
            return name === `GRUPO ${letter}` || name.endsWith(` ${letter}`) || name === letter;
        });
        
        if (group && group.standings && group.standings[pos]) {
            const teamName = getTeamName(group.standings[pos]);
            if (teamName && teamName !== 'A Definir') return teamName;
        }
        return `${pos === 0 ? '1º' : '2º'} Grupo ${letter}`;
    };

    // Cruzamentos Oficiais Padrão (Mundial de Clubes 2025 / Copa)
    const matchups = [
        { id: 'Oitavas 1', t1: getTeamByLetter('A', 0), t2: getTeamByLetter('B', 1) },
        { id: 'Oitavas 2', t1: getTeamByLetter('C', 0), t2: getTeamByLetter('D', 1) },
        { id: 'Oitavas 3', t1: getTeamByLetter('E', 0), t2: getTeamByLetter('F', 1) },
        { id: 'Oitavas 4', t1: getTeamByLetter('G', 0), t2: getTeamByLetter('H', 1) },
        { id: 'Oitavas 5', t1: getTeamByLetter('B', 0), t2: getTeamByLetter('A', 1) },
        { id: 'Oitavas 6', t1: getTeamByLetter('D', 0), t2: getTeamByLetter('C', 1) },
        { id: 'Oitavas 7', t1: getTeamByLetter('F', 0), t2: getTeamByLetter('E', 1) },
        { id: 'Oitavas 8', t1: getTeamByLetter('H', 0), t2: getTeamByLetter('G', 1) },
    ];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chaveamento Simulado</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: black; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 14px; color: #444; margin-top: 5px; }

          /* Resumo dos Grupos */
          .group-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px; }
          .group-card { border: 2px solid black; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
          .group-name { font-weight: 900; background: #eee; text-align: center; padding: 4px; border-bottom: 2px solid black; font-size: 14px; text-transform: uppercase; }
          .team-line { font-weight: bold; font-size: 12px; padding: 6px 8px; border-bottom: 1px solid #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
          .team-line:last-child { border-bottom: none; }

          /* Bracket Layout 4 Colunas */
          .bracket-container { display: flex; justify-content: space-between; gap: 15px; margin-top: 30px; page-break-inside: avoid; }
          .column { display: flex; flex-direction: column; justify-content: space-around; flex: 1; }
          .col-title { text-align: center; font-weight: 900; font-size: 14px; margin-bottom: 15px; text-transform: uppercase; }

          .match-box { border: 2px solid #ccc; border-radius: 6px; margin-bottom: 15px; background: #fff; overflow: hidden; box-shadow: 2px 2px 0px #eee; }
          .match-header { background: #f9f9f9; font-size: 11px; font-weight: bold; padding: 4px 8px; border-bottom: 1px solid #eee; color: #555; text-transform: uppercase;}
          .team-slot { height: 28px; padding: 0 8px; display: flex; align-items: center; font-size: 13px; font-weight: bold; border-bottom: 1px dashed #eee; color: black; }
          .team-slot:last-child { border-bottom: none; }
          
          /* Se tiver 'Grupo' no nome, fica clarinho para escrever. Se for o time, fica escuro! */
          .empty-slot { color: #aaa; font-weight: normal; font-style: italic; }

          .footer { margin-top: 30px; text-align: center; font-size: 12px; font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Chaveamento Mata-Mata - ${pool?.name || ''}</h1>
          <p class="subtitle">Com base na sua simulação da Fase de Grupos. Preencha quem avança até o título!</p>
        </div>

        <div class="group-grid">
          ${simulatedResults?.map((g: any) => `
            <div class="group-card">
              <div class="group-name">${getGroupName(g)}</div>
              <div class="team-line">1º ${getTeamName(g.standings[0])}</div>
              <div class="team-line">2º ${getTeamName(g.standings[1])}</div>
            </div>
          `).join('')}
        </div>

        <div class="bracket-container">
          <!-- Oitavas de Final -->
          <div class="column">
            <div class="col-title">Oitavas</div>
            ${matchups.map(m => `
              <div class="match-box" style="border-color: black;">
                <div class="match-header">${m.id}</div>
                <div class="team-slot ${m.t1.includes('Grupo') ? 'empty-slot' : ''}">${m.t1}</div>
                <div class="team-slot ${m.t2.includes('Grupo') ? 'empty-slot' : ''}">${m.t2}</div>
              </div>
            `).join('')}
          </div>

          <!-- Quartas de Final -->
          <div class="column" style="justify-content: space-evenly;">
            <div class="col-title">Quartas</div>
            ${[1,2,3,4].map(i => `
              <div class="match-box">
                <div class="match-header">Quartas ${i}</div>
                <div class="team-slot empty-slot">Vencedor Oitavas</div>
                <div class="team-slot empty-slot">Vencedor Oitavas</div>
              </div>
            `).join('')}
          </div>

          <!-- Semifinais -->
          <div class="column" style="justify-content: space-evenly;">
            <div class="col-title">Semifinais</div>
            ${[1,2].map(i => `
              <div class="match-box">
                <div class="match-header">Semi ${i}</div>
                <div class="team-slot empty-slot">Vencedor Quartas</div>
                <div class="team-slot empty-slot">Vencedor Quartas</div>
              </div>
            `).join('')}
          </div>

          <!-- Finais -->
          <div class="column" style="justify-content: center; gap: 40px;">
            <div class="col-title">Finais</div>
            <div class="match-box">
              <div class="match-header">GRANDE FINAL</div>
              <div class="team-slot empty-slot">Vencedor Semi 1</div>
              <div class="team-slot empty-slot">Vencedor Semi 2</div>
            </div>
            <div class="match-box">
              <div class="match-header">Disputa 3º Lugar</div>
              <div class="team-slot empty-slot">Perdedor Semi 1</div>
              <div class="team-slot empty-slot">Perdedor Semi 2</div>
            </div>
          </div>
        </div>

        <div class="footer">
          * Rascunho de preenchimento. Lembre-se de repassar seus palpites do mata-mata para o sistema oficial antes do prazo!
        </div>
        <script>
          setTimeout(() => { window.print(); window.close(); }, 800);
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