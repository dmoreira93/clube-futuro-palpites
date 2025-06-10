// src/components/simulation/KnockoutBracket.tsx

import React from 'react'; // Importação do React é necessária para componentes
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- PROPS PARA OS COMPONENTES ---
interface KnockoutBracketProps {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string) => void;
  onAdoptFinalPrediction: (role: 'champion' | 'runner_up' | 'third_place', teamId: string | undefined) => void;
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

// --- COMPONENTES DEFINIDOS FORA DO COMPONENTE PRINCIPAL ---

const InteractiveMatchup: React.FC<InteractiveMatchupProps> = ({ matchId, title, team1, team2, selectedValue, onSelectionChange }) => {
  const canSelect = team1 && team2;

  return (
    <div className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm h-[68px] flex flex-col justify-center">
      <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
      <Select
        onValueChange={(value) => onSelectionChange(matchId, value)}
        value={selectedValue || ""}
        disabled={!canSelect}
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Aguardando..." />
        </SelectTrigger>
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
  const getTeam = (groupName: string, position: number): SimulatedTeamStats | undefined => {
    return simulatedGroups.find(g => g.groupName === groupName)?.standings[position - 1];
  };

  const findTeamById = (teamId?: string): SimulatedTeamStats | undefined => {
    if (!teamId) return undefined;
    return allTeams.find(t => t.teamId === teamId);
  };
  
  const getLoser = (dependsOn: [string, string], winnerId?: string): SimulatedTeamStats | undefined => {
    const t1 = findTeamById(knockoutSelections[dependsOn[0]]);
    const t2 = findTeamById(knockoutSelections[dependsOn[1]]);
    if (!t1 || !t2 || !winnerId) return undefined;
    return winnerId === t1.teamId ? t2 : t1;
  };

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

  const champion = findTeamById(knockoutSelections['final']);
  const runnerUp = getLoser(['sf-1', 'sf-2'], knockoutSelections['final']);
  const thirdPlace = findTeamById(knockoutSelections['third_place']);
  
  return (
    <Card id="printable-bracket">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
        <Button variant="outline" onClick={() => window.print()} className="print-hidden">
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Oitavas de Final</h3>
          {r16.map(match => <StaticMatchup key={match.id} {...match} winnerId={knockoutSelections[match.id]} />)}
        </div>
        <div className="space-y-[6.5rem]">
          <h3 className="font-bold text-lg text-center">Quartas de Final</h3>
          <InteractiveMatchup matchId='qf-1' title='Quartas 1' team1={findTeamById(knockoutSelections['r16-1'])} team2={findTeamById(knockoutSelections['r16-2'])} selectedValue={knockoutSelections['qf-1']} onSelectionChange={onSelectionChange} />
          <InteractiveMatchup matchId='qf-2' title='Quartas 2' team1={findTeamById(knockoutSelections['r16-3'])} team2={findTeamById(knockoutSelections['r16-4'])} selectedValue={knockoutSelections['qf-2']} onSelectionChange={onSelectionChange} />
          <InteractiveMatchup matchId='qf-3' title='Quartas 3' team1={findTeamById(knockoutSelections['r16-5'])} team2={findTeamById(knockoutSelections['r16-6'])} selectedValue={knockoutSelections['qf-3']} onSelectionChange={onSelectionChange} />
          <InteractiveMatchup matchId='qf-4' title='Quartas 4' team1={findTeamById(knockoutSelections['r16-7'])} team2={findTeamById(knockoutSelections['r16-8'])} selectedValue={knockoutSelections['qf-4']} onSelectionChange={onSelectionChange} />
        </div>
        <div className="space-y-[15.5rem]">
           <h3 className="font-bold text-lg text-center">Semifinais</h3>
           <InteractiveMatchup matchId='sf-1' title='Semi 1' team1={findTeamById(knockoutSelections['qf-1'])} team2={findTeamById(knockoutSelections['qf-2'])} selectedValue={knockoutSelections['sf-1']} onSelectionChange={onSelectionChange} />
           <InteractiveMatchup matchId='sf-2' title='Semi 2' team1={findTeamById(knockoutSelections['qf-3'])} team2={findTeamById(knockoutSelections['qf-4'])} selectedValue={knockoutSelections['sf-2']} onSelectionChange={onSelectionChange} />
        </div>
        <div className="space-y-8">
          <h3 className="font-bold text-lg text-center">Finais</h3>
          <div className="md:mt-[18rem]">
            <InteractiveMatchup matchId='final' title='Final' team1={findTeamById(knockoutSelections['sf-1'])} team2={findTeamById(knockoutSelections['sf-2'])} selectedValue={knockoutSelections['final']} onSelectionChange={onSelectionChange} />
            {champion && runnerUp && (
              <div className="mt-2 space-y-1 text-center">
                  <Button size="sm" className="w-full bg-green-600" onClick={() => onAdoptFinalPrediction('champion', champion.teamId)}>Adotar {champion.teamName} como Campeão</Button>
                  <Button size="sm" className="w-full bg-orange-600" onClick={() => onAdoptFinalPrediction('runner_up', runnerUp.teamId)}>Adotar {runnerUp.teamName} como Vice</Button>
              </div>
            )}
          </div>
          <div className="md:mt-[10rem]">
            <InteractiveMatchup matchId='third_place' title='Disputa 3º Lugar' team1={getLoser(['sf-1','sf-2'], knockoutSelections['final'])} team2={getLoser(['sf-1','sf-2'], knockoutSelections['third_place'])} selectedValue={knockoutSelections['third_place']} onSelectionChange={onSelectionChange} />
             {thirdPlace && (
                <div className="mt-2 space-y-1 text-center">
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