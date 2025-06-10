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
    // ... (esta função não precisa de mudanças, permanece como está)
  };

  const handleKnockoutSelection = useCallback((matchId: string, teamId: string | null) => {
    // ... (esta função permanece como está)
  }, []);

  // --- FUNÇÕES DE "ADOTAR" COM LÓGICA REFORÇADA ---

  const handleAdoptGroupPrediction = async (groupId: string, teamId: string, position: 1 | 2) => {
    if (!user) return toast.error('Você precisa estar logado.');
    const toastId = toast.loading('Salvando palpite do grupo...');
    
    const fieldToUpdate = position === 1 ? 'predicted_first_team_id' : 'predicted_second_team_id';
    
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('group_predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', groupId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const payload = {
        ...(existing || {}),
        user_id: user.id,
        group_id: groupId,
        [fieldToUpdate]: teamId,
      };

      // Limpa o ID se for um registro novo para não dar conflito
      if (!existing) {
        delete payload.id;
      }
      
      const { error } = await supabase.from('group_predictions').upsert(payload);

      if (error) throw error;
      toast.success(`Palpite para ${position}º do grupo salvo!`, { id: toastId });
    } catch (error: any) {
      console.error("Erro em handleAdoptGroupPrediction:", error);
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    }
  };
  
  const handleAdoptFinalPrediction = async (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string | undefined) => {
    if (!user) return toast.error('Você precisa estar logado.');
    if (!teamId) return toast.error('Time inválido para salvar.');

    const toastId = toast.loading(`Salvando palpite de ${role.replace('_', ' ')}...`);
    
    const columnMap = {
      champion: 'champion_id', runner_up: 'runner_up_id',
      third_place: 'third_place_id', fourth_place: 'fourth_place_id',
    };
    const column = columnMap[role];

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('final_predictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      const payload = {
        ...(existing || {}),
        user_id: user.id,
        [column]: teamId,
      };
      
      // Limpa o ID se for um registro novo para não dar conflito
      if (!existing) {
        delete payload.id;
      }

      const { error } = await supabase.from('final_predictions').upsert(payload);
      
      if (error) throw error;
      toast.success(`Palpite de ${role.replace('_', ' ')} salvo!`, { id: toastId });
    } catch (error: any)
    {
      console.error("Erro em handleAdoptFinalPrediction:", error);
      toast.error(`Erro ao salvar palpite final: ${error.message}`, { id: toastId });
    }
  };
  
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* O JSX do componente permanece o mesmo da resposta anterior */}
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