// src/pages/Simulador.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { calculateGroupStandings, SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import SimulatedGroupTables from '@/components/simulation/SimulatedGroupTables';
import KnockoutBracket from '@/components/simulation/KnockoutBracket';

const Simulador = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<SimulatedGroup[] | null>(null);
  const [allTeams, setAllTeams] = useState<SimulatedTeamStats[]>([]);
  const [knockoutSelections, setKnockoutSelections] = useState<{ [matchId: string]: string }>({});

  const handleSimulation = async () => {
    // ... (função de simulação permanece a mesma)
    if (!user) {
      toast.error('Você precisa estar logado para simular seus palpites.');
      return;
    }
    setIsLoading(true);
    setSimulatedResults(null);
    setKnockoutSelections({}); // Limpa seleções anteriores
    try {
      const [{ data: predictionsQueryData, error: pError }, { data: teamsData, error: tError }, { data: groupsData, error: gError }] = await Promise.all([
        supabase.from('match_predictions')
          .select('home_score, away_score, matches!inner(home_team_id, away_team_id)')
          .eq('user_id', user.id),
        supabase.from('teams').select('id, name, group_id'),
        supabase.from('groups').select('id, name')
      ]);

      if (pError || tError || gError) {
        throw pError || tError || gError;
      }
      
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
      
      const results = calculateGroupStandings(formattedPredictions, teamsData || [], groupsData || []);
      setSimulatedResults(results);
      // Armazena todos os times simulados para uso no chaveamento
      setAllTeams(results.flatMap(g => g.standings));
      
      toast.success("Simulação concluída!");

    } catch (error: any) {
      console.error("Erro na simulação:", error);
      toast.error("Ocorreu um erro ao realizar a simulação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NOVAS FUNÇÕES HANDLER ---

  const handleAdoptGroupPrediction = async (groupId: string, teamId: string, position: 1 | 2) => {
    if (!user) return toast.error('Você precisa estar logado.');
    setIsAdopting(true);
    
    const fieldToUpdate = position === 1 ? 'predicted_first_team_id' : 'predicted_second_team_id';
    
    try {
      const { data: existing } = await supabase.from('group_predictions').select('*').eq('user_id', user.id).eq('group_id', groupId).single();
      
      const payload = existing ? { ...existing, [fieldToUpdate]: teamId } : { user_id: user.id, group_id: groupId, [fieldToUpdate]: teamId };

      const { error } = await supabase.from('group_predictions').upsert(payload, { onConflict: 'user_id, group_id' });
      if (error) throw error;
      
      toast.success(`Palpite para ${position}º do grupo salvo!`);
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsAdopting(false);
    }
  };

  const handleKnockoutSelection = (matchId: string, teamId: string) => {
    setKnockoutSelections(prev => ({ ...prev, [matchId]: teamId }));
  };

  const handleAdoptFinalPrediction = async (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string) => {
    if (!user) return toast.error('Você precisa estar logado.');
    setIsAdopting(true);
    
    const columnMap = {
      champion: 'champion_id',
      runner_up: 'runner_up_id',
      third_place: 'third_place_id',
      fourth_place: 'fourth_place_id',
    };
    const column = columnMap[role];

    try {
      const { data: existing } = await supabase.from('final_predictions').select('*').eq('user_id', user.id).single();
      const payload = existing ? { ...existing, [column]: teamId } : { user_id: user.id, [column]: teamId };
      
      const { error } = await supabase.from('final_predictions').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      
      toast.success(`Palpite de ${role.replace('_', ' ')} salvo!`);
    } catch (error: any) {
      toast.error(`Erro ao salvar palpite final: ${error.message}`);
    } finally {
      setIsAdopting(false);
    }
  };

  // --- JSX ATUALIZADO ---
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
          {/* O botão global foi removido */}
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