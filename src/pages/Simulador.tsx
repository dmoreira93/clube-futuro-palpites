// src/pages/Simulador.tsx

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { calculateGroupStandings, SimulatedGroup } from '@/lib/simulationEngine';
import SimulatedGroupTables from '@/components/simulation/SimulatedGroupTables';
import KnockoutBracket from '@/components/simulation/KnockoutBracket'; // <-- Nova importação

const Simulador = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<SimulatedGroup[] | null>(null);

  const handleSimulation = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para simular seus palpites.');
      return;
    }
    setIsLoading(true);
    setSimulatedResults(null);
    try {
      const [{ data: predictionsData, error: pError }, { data: teamsData, error: tError }, { data: groupsData, error: gError }] = await Promise.all([
        supabase.from('match_predictions').select('*, home_team_id:matches(home_team_id), away_team_id:matches(away_team_id)').eq('user_id', user.id),
        supabase.from('teams').select('*'),
        supabase.from('groups').select('*')
      ]);
      if (pError || tError || gError) throw pError || tError || gError;
      if (!predictionsData || predictionsData.length === 0) {
        toast.info("Você ainda não fez palpites para os jogos da fase de grupos.");
        return;
      }
      const results = calculateGroupStandings(predictionsData, teamsData, groupsData);
      setSimulatedResults(results);
      toast.success("Simulação concluída!");
    } catch (error: any) {
      toast.error("Ocorreu um erro ao realizar a simulação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdoptAsPrediction = async () => {
    if (!user || !simulatedResults) return;
    setIsSaving(true);
    try {
      const upsertPayload = simulatedResults.map(group => ({
        user_id: user.id,
        group_id: group.groupId,
        predicted_first_team_id: group.standings[0].teamId,
        predicted_second_team_id: group.standings[1].teamId,
      }));
      
      // Busca os palpites de grupo existentes para usar o 'id' no upsert e evitar duplicatas
      const { data: existingGroupPredictions } = await supabase.from('group_predictions').select('id, group_id').eq('user_id', user.id);
      
      const finalPayload = upsertPayload.map(payload => {
          const existing = existingGroupPredictions?.find(p => p.group_id === payload.group_id);
          return existing ? { ...payload, id: existing.id } : payload;
      });

      const { error } = await supabase.from('group_predictions').upsert(finalPayload);
      if (error) throw error;
      
      toast.success("Palpites de classificação de grupo atualizados com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar palpites: " + error.message);
    } finally {
      setIsSaving(false);
    }
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
          <div className="text-center">
              <Button onClick={handleAdoptAsPrediction} disabled={isSaving} className="bg-fifa-blue">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Salvando..." : "Adotar esta Classificação como meu Palpite"}
              </Button>
          </div>
          <SimulatedGroupTables simulatedGroups={simulatedResults} />
          <KnockoutBracket simulatedGroups={simulatedResults} />
        </>
      )}
    </div>
  );
};

export default Simulador;