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
  const { user, pool } = useAuth();
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
      // Ignora erro de campeonato nulo para garantir que o botão destrave
      let matchesQuery = supabase.from('matches').select('*').order('match_date', { ascending: true });
      if (pool?.championship_id) {
          matchesQuery = matchesQuery.eq('championship_id', pool.championship_id);
      }

      const [matchesRes, teamsRes] = await Promise.all([
        matchesQuery,
        supabase.from('teams').select('id, name')
      ]);

      if (matchesRes.data && teamsRes.data) {
        const teamsMap = new Map(teamsRes.data.map(t => [t.id, t.name]));
        
        const formattedMatches = matchesRes.data.map(m => ({
          ...m,
          home_team: { name: m.home_team_id ? teamsMap.get(m.home_team_id) : 'A Definir' },
          away_team: { name: m.away_team_id ? teamsMap.get(m.away_team_id) : 'A Definir' }
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
        toast.warning("Você ainda não possui palpites salvos neste bolão! Faça seus palpites no sistema primeiro.");
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
      toast.success("Simulação concluída!");

    } catch (error: any) {
      console.error("Erro na simulação:", error);
      // Se a coluna pool_id não existir na tabela, avisamos explicitamente
      if (error.code === 'PGRST200' && error.message.includes('pool_id')) {
          toast.error("Erro no Banco de Dados: A tabela 'match_predictions' precisa da coluna 'pool_id'.", { duration: 8000 });
      } else {
          toast.error("Ocorreu um erro ao realizar a simulação: " + error.message);
      }
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
              {isLoading ? 'Calculando...' : 'Simular Classificação dos Grupos'}
            </Button>
            
            <Button size="lg" variant="outline" onClick={() => window.print()} disabled={printableMatches.length === 0} className="w-full sm:w-auto">
              <FileText className="mr-2 h-5 w-5" /> Imprimir Jogos (Folha para Anotação)
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

      {/* ÁREA DE IMPRESSÃO - Visível apenas quando ctrl+p é acionado */}
      <div className="hidden print:block p-8 bg-white text-black min-h-screen">
        <div className={simulatedResults ? "break-after-page" : ""}>
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-black uppercase">Revista de Palpites - {pool?.name}</h1>
            <p className="text-lg text-gray-600 mt-2">Folha de rascunho para Fase de Grupos</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {printableMatches.map((match, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-300 pb-2">
                <span className="w-5/12 text-right font-bold truncate pr-2">{match.home_team?.name || 'A Definir'}</span>
                <span className="flex items-center gap-2 font-mono">
                  <div className="w-8 h-8 border-2 border-gray-800 rounded flex items-center justify-center"></div>
                  <span className="font-bold text-gray-500">X</span>
                  <div className="w-8 h-8 border-2 border-gray-800 rounded flex items-center justify-center"></div>
                </span>
                <span className="w-5/12 text-left font-bold truncate pl-2">{match.away_team?.name || 'A Definir'}</span>
              </div>
            ))}
          </div>
        </div>

        {simulatedResults && (
          <div className="pt-8">
             <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-black uppercase">Chaveamento Mata-Mata</h1>
              <p className="text-lg text-gray-600 mt-2">Baseado na sua simulação de grupos. Preencha quem avança!</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-10">
              {simulatedResults.map((group) => (
                <div key={group.id} className="border border-gray-400 p-2 text-sm">
                  <div className="font-bold bg-gray-200 text-center mb-1">{group.name}</div>
                  <div>1º {group.standings[0]?.name}</div>
                  <div>2º {group.standings[1]?.name}</div>
                </div>
              ))}
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-3 border border-gray-300 rounded">
                  <div className="w-5/12 border-b-2 border-gray-800 h-6"></div>
                  <div className="font-black text-gray-400">X</div>
                  <div className="w-5/12 border-b-2 border-gray-800 h-6"></div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center text-sm text-gray-500">
              * Rascunho preenchido à mão. Lembre-se de repassar seus palpites oficiais para a plataforma antes do prazo!
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Simulador;