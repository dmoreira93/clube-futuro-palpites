// src/components/simulation/KnockoutBracket.tsx

import React from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- PROPS PARA OS COMPONENTES ---
interface KnockoutBracketProps {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string) => void;
  onAdoptFinalPrediction: (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string | undefined) => void;
  allTeams: SimulatedTeamStats[];
}

interface InteractiveMatchupProps {
  matchId: string;
  title: string;
  team1?: SimulatedTeamStats;
  team2?: SimulatedTeamStats;
  selectedValue?: string;
  onSelectionChange: (matchId: string, teamId: string) => void;
}

interface StaticMatchupProps {
  team1?: SimulatedTeamStats;
  team2?: SimulatedTeamStats;
  title: string;
  winnerId?: string;
}

// --- COMPONENTES AUXILIARES (DEFINIDOS FORA DO RENDER) ---

const InteractiveMatchup: React.FC<InteractiveMatchupProps> = ({ matchId, title, team1, team2, selectedValue, onSelectionChange }) => {
  const canSelect = team1 && team2;
  return (
    <div className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm h-[68px] flex flex-col justify-center">
      <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
      <Select onValueChange={(value) => onSelectionChange(matchId, value)} value={selectedValue || ""} disabled={!canSelect}>
        <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Aguardando..." /></SelectTrigger>
        {canSelect && (
          <SelectContent>
            <SelectItem value={team1.teamId}>{team1.teamName}</SelectItem>
            <SelectItem value={team2.teamId}>{team2.teamName}</SelectItem>
          </SelectContent>
        )}
      </Select>
    </div>
  );
};

const StaticMatchup: React.FC<StaticMatchupProps> = ({ team1, team2, title, winnerId }) => (
  <div className="border p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm h-[68px] flex flex-col justify-center">
    <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
    <div className="space-y-1">
      <p className={winnerId === team1?.teamId ? 'font-bold text-green-600' : 'text-gray-500'}>{team1?.teamName || 'A definir'}</p>
      <p className={winnerId === team2?.teamId ? 'font-bold text-green-600' : 'text-gray-500'}>{team2?.teamName || 'A definir'}</p>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  simulatedGroups,
  knockoutSelections,
  onSelectionChange,
  onAdoptFinalPrediction,
  allTeams,
}) => {
  // Funções de busca
  const getTeam = (groupName: string, position: number): SimulatedTeamStats | undefined => simulatedGroups.find(g => g.groupName === groupName)?.standings[position - 1];
  const findTeamById = (teamId?: string): SimulatedTeamStats | undefined => teamId ? allTeams.find(t => t.teamId === teamId) : undefined;
  
  const getLoser = (team1?: SimulatedTeamStats, team2?: SimulatedTeamStats, winnerId?: string) => {
    if (!team1 || !team2 || !winnerId) return undefined;
    return winnerId === team1.teamId ? team2 : team1;
  };

  // Estrutura das Oitavas (estático)
  const r16 = [
    { id: 'r16-1', title: 'Oitavas 1', team1: getTeam('A', 1), team2: getTeam('B', 2) },
    { id: 'r16-2', title: 'Oitavas 2', team1: getTeam('C', 1), team2: getTeam('D', 2) },
    { id: 'r16-3', title: 'Oitavas 3', team1: getTeam('E', 1), team2: getTeam('F', 2) },
    { id: 'r16-4', title: 'Oitavas 4', team1: getTeam('G', 1), team2: getTeam('H', 2) },
    { id: 'r16-5', title: 'Oitavas 5', team1: getTeam('B', 1), team2: getTeam('A', 2) },
    { id: 'r16-6', title: 'Oitavas 6', team1: getTeam('D', 1), team2: getTeam('C', 2) },
    { id: 'r16-7', title: 'Oitavas 7', team1: getTeam('F', 1), team2: getTeam('E', 2) },
    { id: 'r16-8', title: 'Oitavas 8', team1: getTeam('H', 1), team2: getTeam('G', 2) },
  ];

  // Cálculo dos participantes de cada fase
  const qf1_teams = [findTeamById(knockoutSelections['r16-1']), findTeamById(knockoutSelections['r16-2'])];
  const qf2_teams = [findTeamById(knockoutSelections['r16-3']), findTeamById(knockoutSelections['r16-4'])];
  const qf3_teams = [findTeamById(knockoutSelections['r16-5']), findTeamById(knockoutSelections['r16-6'])];
  const qf4_teams = [findTeamById(knockoutSelections['r16-7']), findTeamById(knockoutSelections['r16-8'])];

  const sf1_teams = [findTeamById(knockoutSelections['qf-1']), findTeamById(knockoutSelections['qf-2'])];
  const sf2_teams = [findTeamById(knockoutSelections['qf-3']), findTeamById(knockoutSelections['qf-4'])];

  const final_teams = [findTeamById(knockoutSelections['sf-1']), findTeamById(knockoutSelections['sf-2'])];

  // **LÓGICA CORRIGIDA E SIMPLIFICADA PARA A DISPUTA DE 3º LUGAR**
  const third_place_teams = [
    getLoser(sf1_teams[0], sf1_teams[1], knockoutSelections['sf-1']),
    getLoser(sf2_teams[0], sf2_teams[1], knockoutSelections['sf-2'])
  ];

  const champion = findTeamById(knockoutSelections['final']);
  const runnerUp = getLoser(final_teams[0], final_teams[1], knockoutSelections['final']);
  const thirdPlace = findTeamById(knockoutSelections['third_place']);
  const fourthPlace = getLoser(third_place_teams[0], third_place_teams[1], knockoutSelections['third_place']);

  return (
    <Card id="knockout-bracket-card"> {/* Renomeado para não conflitar com a impressão */}
      <CardHeader className="flex flex-row items-center justify-between print-hidden">
        <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Oitavas de Final</h3>
          {r16.map(match => <StaticMatchup key={match.id} {...match} winnerId={knockoutSelections[match.id]} />)}
        </div>
        <div className="space-y-[6.5rem]">
          <h3 className="font-bold text-lg text-center">Quartas de Final</h3>
          <InteractiveMatchup matchId='qf-1' title='Quartas 1' team1={qf1_teams[0]} team2={qf1_teams[1]} selectedValue={knockoutSelections['qf-1']} onSelectionChange={onSelectionChange} />
          <InteractiveMatchup matchId='qf-2' title='Quartas 2' team1={qf2_teams[0]} team2={qf2_teams[1]} selectedValue={knockoutSelections['qf-2']} onSelectionChange={onSelectionChange} />
          <InteractiveMatchup matchId='qf-3' title='Quartas 3' team1={qf3_teams[0]} team2={qf3_teams[1]} selectedValue={knockoutSelections['qf-3']} onSelectionChange={onSelectionChange} />
          <InteractiveMatchup matchId='qf-4' title='Quartas 4' team1={qf4_teams[0]} team2={qf4_teams[1]} selectedValue={knockoutSelections['qf-4']} onSelectionChange={onSelectionChange} />
        </div>
        <div className="space-y-[15.5rem]">
           <h3 className="font-bold text-lg text-center">Semifinais</h3>
           <InteractiveMatchup matchId='sf-1' title='Semi 1' team1={sf1_teams[0]} team2={sf1_teams[1]} selectedValue={knockoutSelections['sf-1']} onSelectionChange={onSelectionChange} />
           <InteractiveMatchup matchId='sf-2' title='Semi 2' team1={sf2_teams[0]} team2={sf2_teams[1]} selectedValue={knockoutSelections['sf-2']} onSelectionChange={onSelectionChange} />
        </div>
        <div className="space-y-8">
          <h3 className="font-bold text-lg text-center">Finais</h3>
          <div className="md:mt-[18rem]">
            <InteractiveMatchup matchId='final' title='Final' team1={final_teams[0]} team2={final_teams[1]} selectedValue={knockoutSelections['final']} onSelectionChange={onSelectionChange} />
            {champion && runnerUp && (
              <div className="mt-2 space-y-1 text-center print-hidden">
                  <Button size="sm" className="w-full bg-green-600" onClick={() => onAdoptFinalPrediction('champion', champion.teamId)}>Adotar {champion.teamName} como Campeão</Button>
                  <Button size="sm" className="w-full bg-orange-600" onClick={() => onAdoptFinalPrediction('runner_up', runnerUp.teamId)}>Adotar {runnerUp.teamName} como Vice</Button>
              </div>
            )}
          </div>
          <div className="md:mt-[10rem]">
            <InteractiveMatchup matchId='third_place' title='Disputa 3º Lugar' team1={third_place_teams[0]} team2={third_place_teams[1]} selectedValue={knockoutSelections['third_place']} onSelectionChange={onSelectionChange} />
             {thirdPlace && fourthPlace && (
                <div className="mt-2 space-y-1 text-center print-hidden">
                    <Button size="sm" className="w-full bg-yellow-600" onClick={() => onAdoptFinalPrediction('third_place', thirdPlace.teamId)}>Adotar {thirdPlace.teamName} como 3º</Button>
                </div>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;