// src/pages/Simulador.tsx

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateGroupStandings, SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import SimulatedGroupTables from '@/components/simulation/SimulatedGroupTables';
import KnockoutBracket from '@/components/simulation/KnockoutBracket';

interface Team {
  id: string;
  name: string;
  group_id: string;
}

const Simulador = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<SimulatedGroup[] | null>(null);
  const [allTeams, setAllTeams] = useState<SimulatedTeamStats[]>([]);
  const [knockoutSelections, setKnockoutSelections] = useState<{ [matchId: string]: string }>({});

  const handleSimulation = async () => {
    // ... (esta função não precisa de mudanças)
    if (!user) {
      toast.error('Você precisa estar logado para simular seus palpites.');
      return;
    }
    setIsLoading(true);
    setSimulatedResults(null);
    try {
      const [{ data: predictionsQueryData, error: pError }, { data: teamsData, error: tError }, { data: groupsData, error: gError }] = await Promise.all([
        supabase.from('match_predictions')
          .select('home_score, away_score, matches!inner(home_team_id, away_team_id)')
          .eq('user_id', user.id),
        supabase.from('teams').select('id, name, group_id'),
        supabase.from('groups').select('id, name')
      ]);

      if (pError || tError || gError) throw pError || tError || gError;
      if (!predictionsQueryData || predictionsQueryData.length === 0) {
        toast.info("Você ainda não fez palpites para os jogos da fase de grupos.");
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

      const r16Selections: { [key: string]: string } = {};
      const getTeam = (groupName: string, position: number) => results.find(g => g.groupName === groupName)?.standings[position - 1];
      
      const r16matches = [
        { id: 'r16-1', winner: getTeam('A', 1) }, { id: 'r16-2', winner: getTeam('C', 1) },
        { id: 'r16-3', winner: getTeam('E', 1) }, { id: 'r16-4', winner: getTeam('G', 1) },
        { id: 'r16-5', winner: getTeam('B', 1) }, { id: 'r16-6', winner: getTeam('D', 1) },
        { id: 'r16-7', winner: getTeam('F', 1) }, { id: 'r16-8', winner: getTeam('H', 1) },
      ];

      r16matches.forEach(match => {
        if (match.winner) r16Selections[match.id] = match.winner.teamId;
      });
      setKnockoutSelections(r16Selections);
      
      toast.success("Simulação concluída!");

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
        'qf-1': ['sf-1', 'final', 'third_place'], 'qf-2': ['sf-1', 'final', 'third_place'],
        'qf-3': ['sf-2', 'final', 'third_place'], 'qf-4': ['sf-2', 'final', 'third_place'],
        'sf-1': ['final', 'third_place'], 'sf-2': ['final', 'third_place'],
      };
      
      const downstreamMatchesToClear = cascadeClearMap[matchId as keyof typeof cascadeClearMap];
      if (downstreamMatchesToClear) {
        downstreamMatchesToClear.forEach(idToClear => { delete newState[idToClear]; });
      }
      return newState;
    });
  }, []);

  // --- FUNÇÕES DE "ADOTAR" CORRIGIDAS ---
  
  const handleAdoptGroupPrediction = async (groupId: string, teamId: string, position: 1 | 2) => {
    if (!user) return toast.error('Você precisa estar logado.');
    
    const toastId = toast.loading('Salvando palpite do grupo...');
    setIsAdopting(true);
    
    const fieldToUpdate = position === 1 ? 'predicted_first_team_id' : 'predicted_second_team_id';
    
    try {
      const { data: existing } = await supabase.from('group_predictions').select('id, predicted_first_team_id, predicted_second_team_id').eq('user_id', user.id).eq('group_id', groupId).maybeSingle();
      
      const payload: any = { 
        user_id: user.id, 
        group_id: groupId,
      };
      
      if (existing) {
        payload.id = existing.id;
        payload.predicted_first_team_id = position === 1 ? teamId : existing.predicted_first_team_id;
        payload.predicted_second_team_id = position === 2 ? teamId : existing.predicted_second_team_id;
      } else {
        payload[fieldToUpdate] = teamId;
      }

      const { error } = await supabase.from('group_predictions').upsert(payload, { onConflict: 'user_id, group_id' });
      if (error) throw error;
      
      toast.success(`Palpite para ${position}º do grupo salvo!`, { id: toastId });
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setIsAdopting(false);
    }
  };

  const handleAdoptFinalPrediction = async (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string | undefined) => {
    if (!user) return toast.error('Você precisa estar logado.');
    if (!teamId) return toast.error('Time inválido para salvar.');

    const toastId = toast.loading(`Salvando palpite de ${role.replace('_', ' ')}...`);
    setIsAdopting(true);
    
    const columnMap = {
      champion: 'champion_id',
      runner_up: 'runner_up_id',
      third_place: 'third_place_id',
      fourth_place: 'fourth_place_id',
    };
    const column = columnMap[role];

    try {
      const { data: existing } = await supabase.from('final_predictions').select('id').eq('user_id', user.id).maybeSingle();
      
      const payload: any = { user_id: user.id, [column]: teamId };
      if (existing) {
        payload.id = existing.id; // Garante que a linha existente será atualizada
      }

      const { error } = await supabase.from('final_predictions').upsert(payload).select().single();
      if (error) throw error;
      
      toast.success(`Palpite de ${role.replace('_', ' ')} salvo!`, { id: toastId });
    } catch (error: any) {
      toast.error(`Erro ao salvar palpite final: ${error.message}`, { id: toastId });
    } finally {
      setIsAdopting(false);
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <Card className="text-center print-hidden">
            <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Simulador de Bolão</CardTitle>
                <CardDescription>
                    Veja como ficaria a fase de grupos e o chaveamento com base nos seus palpites de jogos!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button size="lg" onClick={handleSimulation} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Calculando...' : 'Simular Classificação dos Grupos'}
                </Button>
            </CardContent>
        </Card>
        
        {simulatedResults && (
            <>
                <div className="text-center print-hidden">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir Simulação
                    </Button>
                </div>

                <div id="printable-simulation" className="space-y-8">
                    <div id="simulation-group-tables">
                        <h2 className="text-2xl font-bold text-center mb-4 hidden print:block">Classificação da Fase de Grupos</h2>
                        <SimulatedGroupTables simulatedGroups={simulatedResults} onAdoptPrediction={handleAdoptGroupPrediction} />
                    </div>
                    <div id="simulation-knockout-bracket">
                        <h2 className="text-2xl font-bold text-center mt-8 mb-4 hidden print:block">Chaveamento Mata-Mata</h2>
                        <KnockoutBracket
                            simulatedGroups={simulatedResults}
                            knockoutSelections={knockoutSelections}
                            onSelectionChange={handleKnockoutSelection}
                            onAdoptFinalPrediction={handleAdoptFinalPrediction}
                            allTeams={allTeams}
                        />
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default Simulador;