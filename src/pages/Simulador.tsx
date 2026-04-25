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

      // Filtra pelo campeonato atual
      if (poolWithChamp?.championship_id) {
          query = query.eq('championship_id', poolWithChamp.championship_id);
      }

      const { data, error } = await query;

      if (error) {
         console.error("Erro ao buscar rascunho de jogos para impressão:", error);
         return;
      }

      if (data) {
        // Formata com segurança caso o Supabase devolva arrays ou nulos
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

      {/* ÁREA DE IMPRESSÃO (Força a exibição de cores e bordas independentemente da preferência do navegador) */}
      <div 
        className="hidden print:block p-8 bg-white text-black min-h-screen font-sans" 
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className={simulatedResults ? "break-after-page" : ""}>
          <div className="text-center mb-8 border-b-4 border-black pb-4">
            <h1 className="text-3xl font-black uppercase">Revista de Palpites - {pool?.name}</h1>
            <p className="text-lg text-gray-700 mt-2 font-semibold">Folha de rascunho para a Fase de Grupos</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {printableMatches.map((match, idx) => (
              <div key={idx} className="flex justify-between items-center border-b-2 border-gray-300 pb-2">
                <span className="w-5/12 text-right font-bold truncate pr-2 text-sm">{match.home_team?.name}</span>
                <span className="flex items-center gap-2">
                  <div className="w-8 h-8 border-[3px] border-black rounded flex items-center justify-center"></div>
                  <span className="font-black text-gray-800">X</span>
                  <div className="w-8 h-8 border-[3px] border-black rounded flex items-center justify-center"></div>
                </span>
                <span className="w-5/12 text-left font-bold truncate pl-2 text-sm">{match.away_team?.name}</span>
              </div>
            ))}
          </div>
        </div>

        {simulatedResults && (
          <div className="pt-8">
             <div className="text-center mb-8 border-b-4 border-black pb-4">
              <h1 className="text-3xl font-black uppercase">Chaveamento Mata-Mata</h1>
              <p className="text-lg text-gray-700 mt-2 font-semibold">Preencha quem avança até o título!</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-10">
              {simulatedResults.map((group) => (
                <div key={group.id} className="border-2 border-black p-2 text-sm rounded-md shadow-sm">
                  <div className="font-black bg-gray-200 text-center mb-2 pb-1 border-b border-black">{group.name}</div>
                  <div className="font-semibold text-gray-800">1º {group.standings[0]?.name}</div>
                  <div className="font-semibold text-gray-800">2º {group.standings[1]?.name}</div>
                </div>
              ))}
            </div>

            <div className="space-y-6 max-w-2xl mx-auto mt-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-2 border-black rounded-lg bg-gray-50">
                  <div className="w-5/12 h-[3px] bg-black"></div>
                  <div className="font-black text-black text-xl px-4">X</div>
                  <div className="w-5/12 h-[3px] bg-black"></div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center text-sm font-bold text-gray-500">
              * Lembre-se de repassar seus rascunhos para a plataforma antes do prazo oficial!
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Simulador;