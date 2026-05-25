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
import KnockoutBracket, { obterMelhoresTerceiros } from '@/components/simulation/KnockoutBracket';
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

    const getTeamName = (t: any) => t?.teamName || t?.team_name || t?.name || t?.team?.name || 'A Definir';

    const getTeam = (groupLetter: string, position: number) => {
      const group: any = simulatedResults?.find((g: any) => {
        const name = (g?.groupName || g?.group_name || g?.name || '').toUpperCase().trim();
        return name === `GRUPO ${groupLetter}` || name.endsWith(` ${groupLetter}`) || name === groupLetter;
      });
      return group?.standings[position - 1];
    };

    const { teams: melhoresTerceiros } = obterMelhoresTerceiros(simulatedResults || []);
    let terceirosDisponiveis = [...melhoresTerceiros.slice(0, 8)];

    const alocarTerceiroUniversal = (gruposPermitidos: string[], idxFallback: number) => {
      const idx = terceirosDisponiveis.findIndex(t => gruposPermitidos.includes(t.groupLetter));
      if (idx !== -1) return terceirosDisponiveis.splice(idx, 1)[0];
      return melhoresTerceiros[idxFallback] || { teamName: 'A Definir', groupLetter: '' };
    };

    // 1. Calcula internamente os jogos na ordem correta de prioridades da FIFA
    const jogosCalculados: Record<string, { id: string; title: string; t1: any; t2: any }> = {
      'J73': { id: '3',  title: 'Jogo 73', t1: getTeam('A', 2), t2: getTeam('B', 2) },
      'J74': { id: '1',  title: 'Jogo 74', t1: getTeam('E', 1), t2: alocarTerceiroUniversal(['A','B','C','D','F'], 0) },
      'J75': { id: '4',  title: 'Jogo 75', t1: getTeam('F', 1), t2: getTeam('C', 2) },
      'J76': { id: '9',  title: 'Jogo 76', t1: getTeam('C', 1), t2: getTeam('F', 2) },
      'J77': { id: '2',  title: 'Jogo 77', t1: getTeam('I', 1), t2: alocarTerceiroUniversal(['C','D','F','G','H'], 1) },
      'J78': { id: '10', title: 'Jogo 78', t1: getTeam('E', 2), t2: getTeam('I', 2) },
      'J79': { id: '11', title: 'Jogo 79', t1: getTeam('A', 1), t2: alocarTerceiroUniversal(['C','E','F','H','I'], 4) },
      'J80': { id: '12', title: 'Jogo 80', t1: getTeam('L', 1), t2: alocarTerceiroUniversal(['E','H','I','J','K'], 5) },
      'J81': { id: '7',  title: 'Jogo 81', t1: getTeam('D', 1), t2: alocarTerceiroUniversal(['B','E','F','I','J'], 2) },
      'J82': { id: '8',  title: 'Jogo 82', t1: getTeam('G', 1), t2: alocarTerceiroUniversal(['A','E','H','I','J'], 3) },
      'J83': { id: '5',  title: 'Jogo 83', t1: getTeam('K', 2), t2: getTeam('L', 2) },
      { id: '6',  title: 'Jogo 84', t1: getTeam('H', 1), t2: getTeam('J', 2) },
      'J85': { id: '15', title: 'Jogo 85', t1: getTeam('B', 1), t2: alocarTerceiroUniversal(['E','F','G','I','J'], 6) },
      'J86': { id: '13', title: 'Jogo 86', t1: getTeam('J', 1), t2: getTeam('H', 2) },
      'J87': { id: '16', title: 'Jogo 87', t1: getTeam('K', 1), t2: alocarTerceiroUniversal(['D','E','I','J','L'], 7) },
      'J88': { id: '14', title: 'Jogo 88', t1: getTeam('D', 2), t2: getTeam('G', 2) },
    };

    // 2. Organiza o array final na ordem estrita de visualização vertical do PDF
    const r32 = [
      jogosCalculados['J74'],
      jogosCalculados['J77'],
      jogosCalculados['J73'],
      jogosCalculados['J75'],
      jogosCalculados['J83'],
      jogosCalculados['J84'],
      jogosCalculados['J81'],
      jogosCalculados['J82'],
      jogosCalculados['J76'],
      jogosCalculados['J78'],
      jogosCalculados['J79'],
      jogosCalculados['J80'],
      jogosCalculados['J86'],
      jogosCalculados['J88'],
      jogosCalculados['J85'],
      jogosCalculados['J87'],
    ];

    const getSelection = (matchId: string, fallback: string) => {
      const selectedId = knockoutSelections[matchId];
      if (selectedId) {
        const team = allTeams.find(t => t.teamId === selectedId);
        if (team) return team.teamName;
      }
      return fallback;
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chaveamento Simulado FIFA 2026</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          body { font-family: Arial, sans-serif; padding: 0; margin: 0; color: black; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 10px; color: #444; margin-top: 3px; }

          .group-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 10px; }
          .group-card { border: 1.5px solid black; border-radius: 4px; overflow: hidden; }
          .group-name { font-weight: 900; background: #eee; text-align: center; padding: 2px; border-bottom: 1.5px solid black; font-size: 9px; text-transform: uppercase; }
          .team-line { font-weight: bold; font-size: 8px; padding: 2px 4px; border-bottom: 1px solid #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .team-line:last-child { border-bottom: none; }

          .thirds-box { border: 1.5px solid #1e293b; background: #f8fafc; border-radius: 4px; padding: 5px; margin-bottom: 12px; text-align: center; }
          .thirds-title { font-size: 9px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 3px; }
          .thirds-list { font-size: 8px; font-weight: bold; color: #334155; }

          .bracket-titles { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
          .col-title { flex: 1; text-align: center; font-weight: 900; font-size: 9px; text-transform: uppercase; background:#1a202c; color:white; padding:3px 0; border-radius:3px; }

          .bracket-container { display: flex; justify-content: space-between; gap: 8px; }
          .column { display: flex; flex-direction: column; justify-content: space-around; flex: 1; }

          .match-box { border: 1.5px solid #000; border-radius: 4px; margin-bottom: 3px; background: #fff; overflow: hidden; }
          .match-header { background: #f1f5f9; font-size: 7px; font-weight: bold; padding: 2px 4px; border-bottom: 1px solid #000; color: #1e293b; text-transform: uppercase;}
          .team-slot { height: 16px; padding: 0 4px; display: flex; align-items: center; font-size: 8px; font-weight: bold; border-bottom: 1px dashed #eee; color: black; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .team-slot:last-child { border-bottom: none; }
          .empty-slot { color: #64748b; font-weight: normal; font-style: italic; }

          .footer { margin-top: 10px; text-align: center; font-size: 8px; font-weight: bold; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Chaveamento Oficial Simulado - ${pool?.name || ''}</h1>
          <p class="subtitle">Simulação regulamentar FIFA 2026 (12 Grupos + 8 Melhores Terceiros)</p>
        </div>

        <div class="group-grid">
          ${simulatedResults?.map((g: any) => `
            <div class="group-card">
              <div class="group-name">${(g.groupName || '').replace('Grupo ', '')}</div>
              <div class="team-line">1º ${getTeamName(g.standings[0])}</div>
              <div class="team-line">2º ${getTeamName(g.standings[1])}</div>
            </div>
          `).join('')}
        </div>

        <div class="thirds-box">
          <div class="thirds-title">Os 8 Melhores Terceiros Colocados Classificados (Critério Índice Técnico)</div>
          <div class="thirds-list">
            ${melhoresTerceiros.slice(0, 8).map(t => `${getTeamName(t)} (Gr. ${t.groupLetter || ''})`).join(' &nbsp;&bull;&nbsp; ')}
          </div>
        </div>

        <div class="bracket-titles">
          <div class="col-title">Segundas de Final</div>
          <div class="col-title">Oitavas de Final</div>
          <div class="col-title">Quartas de Final</div>
          <div class="col-title">Semifinais</div>
          <div class="col-title">Finais</div>
        </div>

        <div class="bracket-container">
          <div class="column">
            ${r32.map(m => `
              <div class="match-box">
                <div class="match-header">${m.title}</div>
                <div class="team-slot">${getTeamName(m.t1)}</div>
                <div class="team-slot">${getTeamName(m.t2)}</div>
              </div>
            `).join('')}
          </div>

          <div class="column">
            ${[89, 90, 93, 94, 91, 92, 95, 96].map((jNum, idx) => {
              const r32Keys = [
                ['r32-1', 'r32-2'], ['r32-3', 'r32-4'], ['r32-5', 'r32-6'], ['r32-7', 'r32-8'],
                ['r32-9', 'r32-10'], ['r32-11', 'r32-12'], ['r32-13', 'r32-14'], ['r32-15', 'r32-16']
              ][idx];
              return `
                <div class="match-box">
                  <div class="match-header">Jogo ${jNum}</div>
                  <div class="team-slot ${!knockoutSelections[r32Keys[0]] ? 'empty-slot' : ''}">${getSelection(r32Keys[0], `Venc. ${r32[parseInt(r32Keys[0].replace('r32-',''))-1].title}`)}</div>
                  <div class="team-slot ${!knockoutSelections[r32Keys[1]] ? 'empty-slot' : ''}">${getSelection(r32Keys[1], `Venc. ${r32[parseInt(r32Keys[1].replace('r32-',''))-1].title}`)}</div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="column">
            ${[97, 98, 99, 100].map((jNum, idx) => {
              const r16Keys = [['r16-1', 'r16-2'], ['r16-3', 'r16-4'], ['r16-5', 'r16-6'], ['r16-7', 'r16-8']][idx];
              const label1 = ['Jogo 89', 'Jogo 93', 'Jogo 91', 'Jogo 95'][idx];
              const label2 = ['Jogo 90', 'Jogo 94', 'Jogo 92', 'Jogo 96'][idx];
              return `
                <div class="match-box">
                  <div class="match-header">Jogo ${jNum}</div>
                  <div class="team-slot ${!knockoutSelections[r16Keys[0]] ? 'empty-slot' : ''}">${getSelection(r16Keys[0], `Venc. ${label1}`)}</div>
                  <div class="team-slot ${!knockoutSelections[r16Keys[1]] ? 'empty-slot' : ''}">${getSelection(r16Keys[1], `Venc. ${label2}`)}</div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="column">
            ${[101, 102].map((jNum, idx) => {
              const qfKeys = [['qf-1', 'qf-2'], ['qf-3', 'qf-4']][idx];
              const label1 = idx === 0 ? 'Jogo 97' : 'Jogo 99';
              const label2 = idx === 0 ? 'Jogo 98' : 'Jogo 100';
              return `
                <div class="match-box">
                  <div class="match-header">Jogo ${jNum}</div>
                  <div class="team-slot ${!knockoutSelections[qfKeys[0]] ? 'empty-slot' : ''}">${getSelection(qfKeys[0], `Venc. ${label1}`)}</div>
                  <div class="team-slot ${!knockoutSelections[qfKeys[1]] ? 'empty-slot' : ''}">${getSelection(qfKeys[1], `Venc. ${label2}`)}</div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="column" style="justify-content: center; gap: 20px;">
            <div class="match-box" style="border-color: #16a34a;">
              <div class="match-header" style="background:#dcfce7;">JOGO 104 (FINAL)</div>
              <div class="team-slot ${!knockoutSelections['sf-1'] ? 'empty-slot' : ''}">${getSelection('sf-1', 'Vencedor Jogo 101')}</div>
              <div class="team-slot ${!knockoutSelections['sf-2'] ? 'empty-slot' : ''}">${getSelection('sf-2', 'Vencedor Jogo 102')}</div>
            </div>
            <div class="match-box">
              <div class="match-header">Jogo 103 (3º Lugar)</div>
              <div class="team-slot empty-slot">Perdedor Jogo 101</div>
              <div class="team-slot empty-slot">Perdedor Jogo 102</div>
            </div>
          </div>
        </div>

        <div class="footer">
          * Rascunho impresso do Simulador Oficial. Não se esqueça de salvar seus palpites no sistema!
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