// src/pages/Simulador.tsx

import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, Printer } from 'lucide-react';
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
    const toastId = toast.loading("Buscando seus palpites...");

    try {
      // Passo 1: Buscar palpites do usuário
      const { data: predictionsQueryData, error: pError } = await supabase
        .from('match_predictions')
        .select('home_score, away_score, matches!inner(home_team_id, away_team_id)')
        .eq('user_id', user.id);

      if (pError) throw new Error(`Erro ao buscar palpites: ${pError.message}`);
      if (!predictionsQueryData || predictionsQueryData.length === 0) {
        toast.info("Você ainda não fez palpites para os jogos da fase de grupos.", { id: toastId });
        setIsLoading(false);
        return;
      }
      
      toast.loading("Buscando dados dos times e grupos...", { id: toastId });

      // Passo 2: Buscar times e grupos
      const [{ data: teamsData, error: tError }, { data: groupsData, error: gError }] = await Promise.all([
        supabase.from('teams').select('id, name, group_id'),
        supabase.from('groups').select('id, name')
      ]);

      if (tError || gError) throw new Error(`Erro ao buscar dados do torneio: ${tError?.message || gError?.message}`);

      toast.loading("Calculando classificações...", { id: toastId });

      // Passo 3: Calcular a simulação
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
      
      toast.success("Simulação concluída!", { id: toastId });

    } catch (error: any) {
      console.error("Erro na simulação:", error);
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdoptGroupPrediction = async (groupId: string, teamId: string, position: 1 | 2) => {
    // ... (esta função está correta, não precisa de alteração)
  };
  
  const handleKnockoutSelection = useCallback((matchId: string, teamId: string | null) => {
    // ... (esta função está correta, não precisa de alteração)
  }, []);

  const handleAdoptFinalPrediction = async (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string | undefined) => {
    // ... (esta função está correta, não precisa de alteração)
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* O JSX permanece o mesmo */}
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
        <div className="space-y-8">
          <div className="text-center print-hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Simulação
            </Button>
          </div>
          <div id="printable-simulation">
            <div id="simulation-group-tables">
              <h2 className="text-2xl font-bold text-center mb-4 hidden print:block">Classificação da Fase de Grupos</h2>
              <SimulatedGroupTables simulatedGroups={simulatedResults} onAdoptPrediction={handleAdoptGroupPrediction} />
            </div>
            <div id="simulation-knockout-bracket" className="mt-8">
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
        </div>
      )}
    </div>
  );
};

export default Simulador;