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
        groupsQuery 
      ]);

      if (pError || tError || gError) throw pError || tError || gError;
      
      if (!predictionsQueryData || predictionsQueryData.length === 0) {
        toast.warning("Você ainda não possui palpites salvos neste bolão! Imprima a folha ao lado ou faça seus palpites no sistema primeiro.");
        setIsLoading(false);
        return;
      }

      const validGroupIds = new Set((groupsData || []).map(g => g.id));
      const filteredTeams = (teamsData || []).filter(t => validGroupIds.has(t.group_id));

      const formattedPredictions = predictionsQueryData.map(p => ({
        home_score: p.home_score,
        away_score: p.away_score,
        home_team_id: p.matches.home_team_id,
        away_team_id: p.matches.away_team_id,
      }));

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
      
      // Mapeamento estendido para suportar o cascade a partir do Round of 32 (Fase de 32 times)
      const cascadeClearMap: { [key: string]: string[] } = {
        'r32-1': ['r16-1', 'qf-1', 'sf-1', 'final', 'third_place'],
        'r32-2': ['r16-1', 'qf-1', 'sf-1', 'final', 'third_place'],
        'r32-3': ['r16-2', 'qf-1', 'sf-1', 'final', 'third_place'],
        'r32-4': ['r16-2', 'qf-1', 'sf-1', 'final', 'third_place'],
        'r16-1': ['qf-1', 'sf-1', 'final', 'third_place'], 
        'r16-2': ['qf-1', 'sf-1', 'final', 'third_place'],
        'r16-3': ['qf-2', 'sf-1', 'final', 'third_place'], 
        'r16-4': ['qf-2', 'sf-1', 'final', 'third_place'],
        'r16-5': ['qf-3', 'sf-2', 'final', 'third_place'], 
        'r16-6': ['qf-3', 'sf-2', 'final', 'third_place'],
        'r16-7': ['qf-4', 'sf-2', 'final', 'third_place'], 
        'r16-8': ['qf-4', 'sf-2', 'final', 'third_place'],
        'qf-1': ['sf-1', 'final', 'third_place'], 
        'qf-2': ['sf-1', 'final', 'third_place'],
        'qf-3': ['sf-2', 'final', 'third_place'], 
        'qf-4': ['sf-2', 'final', 'third_place'],
        'sf-1': ['final', 'third_place'], 
        'sf-2': ['final', 'third_place'],
      };
      const downstreamMatchesToClear = cascadeClearMap[matchId as keyof typeof cascadeClearMap];
      if (downstreamMatchesToClear) downstreamMatchesToClear.forEach(idToClear => { delete newState[idToClear]; });
      return newState;
    });
  }, []);

  // CORRIGIDO E INTEGRADO: Agora usa a nossa RPC em lote para salvar as posições de 1º e 2º de forma instantânea
    const handleAdoptGroupPrediction = async (groupId: string, firstTeamId: string, secondTeamId: string) => {
    if (!user || !pool) return;
    if (firstTeamId === secondTeamId) return toast.error("Você não pode escolher o mesmo time como 1º e 2º lugar.");
    
    const toastId = toast.loading('Salvando palpites do grupo...');
    try {
      const { error } = await supabase.rpc('adotar_posicoes_grupo', {
        p_pool_id: pool.id,
        p_group_id: groupId,
        p_first_team_id: firstTeamId,
        p_second_team_id: secondTeamId
      });

      if (error) throw error;
      toast.success("Posições adotadas e salvas com sucesso!", { id: toastId });
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    }
  };

  const handleAdoptFinalPredictions = async (championId: string, runnerUpId: string, thirdPlaceId: string, fourthPlaceId: string, finalHomeScore: number, finalAwayScore: number) => {
    if (!user || !pool) return;
    const toastId = toast.loading('Salvando palpites finais...');
    try {
      const { error } = await supabase.from('final_predictions').upsert({
        user_id: user.id, pool_id: pool.id, champion_id: championId, runner_up_id: runnerUpId, third_place_id: thirdPlaceId, fourth_place_id: fourthPlaceId, final_home_score: finalHomeScore, final_away_score: finalAwayScore,
      }, { onConflict: 'user_id, pool_id' });
      if (error) throw error;
      toast.success('Palpites finais salvos com sucesso!', { id: toastId });
    } catch (error: any) {
      toast.error(`Erro ao salvar palpites finais: ${error.message}`, { id: toastId });
    }
  };

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

    const getGroupName = (g: any) => g?.groupName || g?.group_name || g?.name || g?.group?.name || 'Grupo';
    const getTeamName = (t: any) => t?.teamName || t?.team_name || t?.name || t?.team?.name || 'A Definir';

    const getTeamByLetter = (letter: string, pos: number) => {
        const group: any = simulatedResults?.find((g: any) => {
            const name = getGroupName(g).toUpperCase().trim();
            return name === `GRUPO ${letter}` || name.endsWith(` ${letter}`) || name === letter;
        });
        
        if (group && group.standings && group.standings[pos]) {
            const teamName = getTeamName(group.standings[pos]);
            if (teamName && teamName !== 'A Definir') return teamName;
        }
        return `${pos === 0 ? '1º' : '2º'} Grupo ${letter}`;
    };

    // Mapeamento Expandido: Gerando os confrontos de 16-avos de final conforme a regra oficial da FIFA 2026
    const roundOf32Matches = [
        { id: 'Jogo 1', t1: getTeamByLetter('A', 0), t2: '3º C/D/I' },
        { id: 'Jogo 2', t1: getTeamByLetter('E', 0), t2: getTeamByLetter('A', 1) },
        { id: 'Jogo 3', t1: getTeamByLetter('F', 0), t2: getTeamByLetter('B', 1) },
        { id: 'Jogo 4', t1: getTeamByLetter('C', 0), t2: '3º F/G/T' },
        { id: 'Jogo 5', t1: getTeamByLetter('B', 0), t2: '3º E/H/J' },
        { id: 'Jogo 6', t1: getTeamByLetter('D', 0), t2: getTeamByLetter('C', 1) },
        { id: 'Jogo 7', t1: getTeamByLetter('G', 0), t2: getTeamByLetter('D', 1) },
        { id: 'Jogo 8', t1: getTeamByLetter('H', 0), t2: getTeamByLetter('E', 1) },
    ];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chaveamento Simulado FIFA 2026</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 15px; color: black; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { text-align: center; border-bottom: 3px solid black; padding-bottom: 5px; margin-bottom: 15px; }
          .title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 12px; color: #444; margin-top: 3px; }

          .group-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 20px; }
          .group-card { border: 1.5px solid black; border-radius: 4px; overflow: hidden; page-break-inside: avoid; }
          .group-name { font-weight: 900; background: #eee; text-align: center; padding: 2px; border-bottom: 1.5px solid black; font-size: 11px; text-transform: uppercase; }
          .team-line { font-weight: bold; font-size: 10px; padding: 4px 6px; border-bottom: 1px solid #ccc; text-overflow: ellipsis; overflow: hidden; }

          /* Layout Expandido de 5 Colunas para caber a Rodada de 32 times */
          .bracket-titles { display: flex; justify-content: space-between; gap: 10px; margin-top: 20px; margin-bottom: 5px; }
          .col-title { flex: 1; text-align: center; font-weight: 900; font-size: 11px; text-transform: uppercase; background:#1a202c; color:white; padding:3px 0; border-radius:2px; }

          .bracket-container { display: flex; justify-content: space-between; gap: 10px; page-break-inside: avoid; }
          .column { display: flex; flex-direction: column; justify-content: space-around; flex: 1; }

          .match-box { border: 1.5px solid #000; border-radius: 4px; margin-bottom: 8px; background: #fff; overflow: hidden; }
          .match-header { background: #f1f5f9; font-size: 9px; font-weight: bold; padding: 2px 6px; border-bottom: 1px solid #000; color: #1e293b; text-transform: uppercase;}
          .team-slot { height: 24px; padding: 0 6px; display: flex; align-items: center; font-size: 10px; font-weight: bold; border-bottom: 1px dashed #eee; color: black; }
          .team-slot:last-child { border-bottom: none; }
          .empty-slot { color: #64748b; font-weight: normal; font-size: 9px; font-style: italic; }

          .footer { margin-top: 25px; text-align: center; font-size: 11px; font-weight: bold; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Chaveamento Expandido - ${pool?.name || ''}</h1>
          <p class="subtitle">Modelo Regulamentar Oficial Copa do Mundo 2026 (Fase de 32, Oitavas, Quartas, Semi e Final)</p>
        </div>

        <div class="group-grid">
          ${simulatedResults?.slice(0, 12).map((g: any) => `
            <div class="group-card">
              <div class="group-name">${getGroupName(g).replace('Grupo ', '')}</div>
              <div class="team-line">1º ${getTeamName(g.standings[0])}</div>
              <div class="team-line">2º ${getTeamName(g.standings[1])}</div>
            </div>
          `).join('')}
        </div>

        <div class="bracket-titles">
          <div class="col-title">Fase de 32</div>
          <div class="col-title">Oitavas</div>
          <div class="col-title">Quartas</div>
          <div class="col-title">Semifinais</div>
          <div class="col-title">Finais</div>
        </div>

        <div class="bracket-container">
          <div class="column">
            ${roundOf32Matches.map(m => `
              <div class="match-box">
                <div class="match-header">${m.id}</div>
                <div class="team-slot ${m.t1.includes('Grupo') ? 'empty-slot' : ''}">${m.t1}</div>
                <div class="team-slot ${m.t2.includes('Grupo') || m.t2.includes('3º') ? 'empty-slot' : ''}">${m.t2}</div>
              </div>
            `).join('')}
          </div>

          <div class="column">
            ${[1, 2, 3, 4].map(i => `
              <div class="match-box">
                <div class="match-header">Oitavas ${i}</div>
                <div class="team-slot empty-slot">Venc. Jogo ${i*2 - 1}</div>
                <div class="team-slot empty-slot">Venc. Jogo ${i*2}</div>
              </div>
            `).join('')}
          </div>

          <div class="column">
            ${[1, 2].map(i => `
              <div class="match-box">
                <div class="match-header">Quartas ${i}</div>
                <div class="team-slot empty-slot">Venc. Oitavas ${i*2 - 1}</div>
                <div class="team-slot empty-slot">Venc. Oitavas ${i*2}</div>
              </div>
            `).join('')}
          </div>

          <div class="column">
            <div class="match-box">
              <div class="match-header">Semifinal 1</div>
              <div class="team-slot empty-slot">Venc. Quartas 1</div>
              <div class="team-slot empty-slot">Venc. Quartas 2</div>
            </div>
          </div>

          <div class="column" style="justify-content: center; gap: 20px;">
            <div class="match-box" style="border-color: #16a34a;">
              <div class="match-header" style="background:#dcfce7;">GRANDE FINAL</div>
              <div class="team-slot empty-slot">Finalista 1</div>
              <div class="team-slot empty-slot">Finalista 2</div>
            </div>
            <div class="match-box">
              <div class="match-header">3º Lugar</div>
              <div class="team-slot empty-slot">Perdedor Semi 1</div>
              <div class="team-slot empty-slot">Perdedor Semi 2</div>
            </div>
          </div>
        </div>

        <div class="footer">
          * Salve suas previsões do chaveamento de 32 times no sistema antes do prazo regulamentar.
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