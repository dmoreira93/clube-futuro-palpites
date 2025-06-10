// src/pages/Simulador.tsx

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateGroupStandings, SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import SimulatedGroupTables from '@/components/simulation/SimulatedGroupTables';
import KnockoutBracket from '@/components/simulation/KnockoutBracket';

// Definição dos tipos para os times, se não estiverem globais
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

      // **NOVO: Pré-preenche os vencedores das oitavas automaticamente**
      // Assume que o vencedor do confronto é sempre o time 1 (melhor classificado)
      const r16Selections: { [key: string]: string } = {};
      const getTeam = (groupName: string, position: number) => results.find(g => g.groupName === groupName)?.standings[position - 1];
      
      const r16matches = [
        { id: 'r16-1', winner: getTeam('A', 1) }, { id: 'r16-2', winner: getTeam('C', 1) },
        { id: 'r16-3', winner: getTeam('E', 1) }, { id: 'r16-4', winner: getTeam('G', 1) },
        { id: 'r16-5', winner: getTeam('B', 1) }, { id: 'r16-6', winner: getTeam('D', 1) },
        { id: 'r16-7', winner: getTeam('F', 1) }, { id: 'r16-8', winner: getTeam('H', 1) },
      ];

      r16matches.forEach(match => {
        if (match.winner) {
          r16Selections[match.id] = match.winner.teamId;
        }
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

  const handleAdoptGroupPrediction = async (groupId: string, teamId: string, position: 1 | 2) => {
    // ... (esta função permanece a mesma da resposta anterior)
  };

  // **NOVO: Lógica de dependência para limpar seleções futuras**
  const knockoutDeps: { [key: string]: string[] } = {
    'qf-1': ['sf-1', 'final-w1', 'final-l1'],
    'qf-2': ['sf-1', 'final-w1', 'final-l1'],
    'qf-3': ['sf-2', 'final-w2', 'final-l2'],
    'qf-4': ['sf-2', 'final-w2', 'final-l2'],
    'sf-1': ['final-w1', 'final-l1'],
    'sf-2': ['final-w2', 'final-l2'],
  };

  const handleKnockoutSelection = (matchId: string, teamId: string) => {
    setKnockoutSelections(prev => {
      const newState = { ...prev, [matchId]: teamId };
      const depsToClear = knockoutDeps[matchId] || [];
      for (const dep of depsToClear) {
        delete newState[dep];
      }
      return newState;
    });
  };

  const handleAdoptFinalPrediction = async (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string) => {
    // ... (esta função permanece a mesma da resposta anterior)
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
        <CardContent>
          <Button size="lg" onClick={handleSimulation} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {isLoading ? 'Calculando...' : 'Simular Classificação dos Grupos'}
          </Button>
        </CardContent>
      </Card>
      
      {simulatedResults && (
        <>
          <SimulatedGroupTables simulatedGroups={simulatedResults} onAdoptPrediction={handleAdoptGroupPrediction} />
          <KnockoutBracket
            simulatedGroups={simulatedResults}
            knockoutSelections={knockoutSelections}
            onSelectionChange={handleKnockoutSelection}
            onAdoptFinalPrediction={handleAdoptFinalPrediction}
            allTeams={allTeams}
          />
        </>
      )}
    </div>
  );
};

export default Simulador;