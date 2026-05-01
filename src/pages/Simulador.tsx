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
  
  const [printableMatches, setPrintableMatches] = useState<any[]>([]);

  const isDeadlinePassed = pool?.prediction_deadline
    ? isAfter(new Date(), new Date(pool.prediction_deadline))
    : false;

  useEffect(() => {
    const fetchMatchesForPrint = async () => {
      const poolWithChamp = pool as any;
      
      let query = supabase
        .from('matches')
        .select(`
          id,
          match_date,
          stage,
          home_team:teams!home_team_id(name),
          away_team:teams!away_team_id(name)
        `)
        .order('match_date', { ascending: true });

      if (poolWithChamp?.championship_id) {
          query = query.eq('championship_id', poolWithChamp.championship_id);
      }

      const { data, error } = await query;

      if (error) {
         console.error("Erro ao buscar rascunho de jogos para impressão:", error);
         return;
      }

      if (data) {
        const getTeamName = (teamData: any) => {
           if (!teamData) return 'A Definir';
           if (Array.isArray(teamData)) return teamData[0]?.name || 'A Definir';
           return teamData.name || 'A Definir';
        };

        const formattedMatches = data.map(m => ({
          ...m,
          home_team: { name: getTeamName(m.home_team) },
          away_team: { name: getTeamName(m.away_team) }
        }));
        
        setPrintableMatches(formattedMatches);
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

  return (
    <>
      {/* ===== ÁREA DE TELA (Oculta na impressão) ===== */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 print:hidden">
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
            
            <Button size="lg" variant="outline" onClick={() => window.print()} disabled={printableMatches.length === 0} className="w-full sm:w-auto">
              <FileText className="mr-2 h-5 w-5" /> Imprimir Jogos (Folha Rascunho)
            </Button>
          </CardContent>
        </Card>

        {simulatedResults && (
          <div className="space-y-8">
            <div className="text-center">
              <Button variant="secondary" onClick={() => window.print()}>
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

      {/* 
        ===== ÁREA DE IMPRESSÃO =====
        Usamos inline-styles pesados (style={{...}}) para garantir que o 
        Chrome não tenha como sobrescrever com as cores do site.
        O absolute e top-0 garantem que a impressão quebre a barreira da tela do site.
      */}
      <div 
        className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:m-0 print:p-8"
        style={{ backgroundColor: 'white', color: 'black', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        
        {/* Folha 1: FASE DE GRUPOS */}
        <div style={{ pageBreakAfter: simulatedResults ? 'always' : 'auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '4px solid black', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'black', textTransform: 'uppercase' }}>
              Revista de Palpites - {pool?.name}
            </h1>
            <p style={{ fontSize: '16px', color: '#333', marginTop: '0.5rem' }}>
              Folha de rascunho para a Fase de Grupos
            </p>
          </div>
          
          {printableMatches.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'black' }}>Nenhum jogo encontrado para imprimir.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '3rem', rowGap: '1rem' }}>
              {printableMatches.map((match, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '0.5rem' }}>
                  <span style={{ width: '40%', textAlign: 'right', fontWeight: 'bold', color: 'black', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.home_team?.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', border: '3px solid black', borderRadius: '4px' }}></div>
                    <span style={{ fontWeight: '900', color: 'black' }}>X</span>
                    <div style={{ width: '30px', height: '30px', border: '3px solid black', borderRadius: '4px' }}></div>
                  </span>
                  <span style={{ width: '40%', textAlign: 'left', fontWeight: 'bold', color: 'black', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {match.away_team?.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Folha 2: MATA-MATA (Só aparece na impressão se o usuário tiver clicado em Simular) */}
        {simulatedResults && (
          <div style={{ paddingTop: '2rem' }}>
             <div style={{ textAlign: 'center', borderBottom: '4px solid black', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'black', textTransform: 'uppercase' }}>
                Chaveamento Mata-Mata
              </h1>
              <p style={{ fontSize: '16px', color: '#333', marginTop: '0.5rem' }}>
                Baseado na sua simulação. Preencha quem avança!
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
              {simulatedResults.map((group) => (
                <div key={group.id} style={{ border: '2px solid black', padding: '0.5rem', fontSize: '14px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '900', backgroundColor: '#eee', textAlign: 'center', marginBottom: '0.5rem', paddingBottom: '0.25rem', borderBottom: '1px solid black', color: 'black' }}>
                    {group.name}
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'black' }}>1º {group.standings[0]?.name}</div>
                  <div style={{ fontWeight: 'bold', color: 'black' }}>2º {group.standings[1]?.name}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', marginTop: '3rem' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '2px solid black', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  <div style={{ width: '40%', height: '3px', backgroundColor: 'black' }}></div>
                  <div style={{ fontWeight: '900', color: 'black', fontSize: '20px', padding: '0 1rem' }}>X</div>
                  <div style={{ width: '40%', height: '3px', backgroundColor: 'black' }}></div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>
              * Lembre-se de repassar seus rascunhos para a plataforma antes do prazo oficial!
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Simulador;