// src/components/simulation/KnockoutBracket.tsx

import React from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Tipos e Interfaces (sem alterações) ---
interface KnockoutBracketProps {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string) => void;
  onAdoptFinalPrediction: (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string | undefined) => void;
  allTeams: SimulatedTeamStats[];
}
interface MatchupProps {
  title: string;
  team1?: SimulatedTeamStats;
  team2?: SimulatedTeamStats;
  selectedValue?: string;
  onSelect: (value: string) => void;
}
interface StaticMatchupProps {
  title: string;
  team1?: SimulatedTeamStats;
  team2?: SimulatedTeamStats;
  winnerId?: string;
}

// --- Componentes Auxiliares (sem alterações na lógica) ---
const Matchup: React.FC<MatchupProps> = ({ title, team1, team2, selectedValue, onSelect }) => {
    const canSelect = team1 && team2;
    return (
      <div className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm h-[68px] flex flex-col justify-center print:h-auto print:text-[9px] print:p-1 print:border-gray-400">
        <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 print:text-[10px] print:font-semibold print:mb-0.5">{title}</p>
        <Select onValueChange={onSelect} value={selectedValue || ""} disabled={!canSelect}>
          <SelectTrigger className="w-full h-8 text-xs print:h-5 print:text-[9px]"><SelectValue placeholder="Aguardando..." /></SelectTrigger>
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
  
  const StaticMatchup: React.FC<StaticMatchupProps> = ({ title, team1, team2, winnerId }) => (
      <div className="border p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm h-[68px] flex flex-col justify-center print:h-auto print:text-[9px] print:p-1 print:border-gray-400">
        <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 print:text-[10px] print:font-semibold print:mb-0.5">{title}</p>
        <div className="space-y-0.5">
          <p className={winnerId === team1?.teamId ? 'font-bold text-green-600' : 'text-gray-500'}>{team1?.teamName || 'A definir'}</p>
          <p className={winnerId === team2?.teamId ? 'font-bold text-green-600' : 'text-gray-500'}>{team2?.teamName || 'A definir'}</p>
        </div>
      </div>
  );

// --- Componente Principal com NOVO LAYOUT ---
const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  simulatedGroups,
  knockoutSelections,
  onSelectionChange,
  onAdoptFinalPrediction,
  allTeams,
}) => {
  // --- Lógica de busca de times (sem alterações) ---
  const getTeam = (groupName: string, position: number) => simulatedGroups.find(g => g.groupName === groupName)?.standings[position - 1];
  const findTeamById = (teamId?: string) => teamId ? allTeams.find(t => t.teamId === teamId) : undefined;
  const getLoser = (team1?: SimulatedTeamStats, team2?: SimulatedTeamStats, winnerId?: string) => {
    if (!team1 || !team2 || !winnerId) return undefined;
    return winnerId === team1.teamId ? team2 : team1;
  };

  const r16 = React.useMemo(() => [
    { id: 'r16-1', team1: getTeam('A', 1), team2: getTeam('B', 2) }, { id: 'r16-2', team1: getTeam('C', 1), team2: getTeam('D', 2) },
    { id: 'r16-3', team1: getTeam('E', 1), team2: getTeam('F', 2) }, { id: 'r16-4', team1: getTeam('G', 1), team2: getTeam('H', 2) },
    { id: 'r16-5', team1: getTeam('B', 1), team2: getTeam('A', 2) }, { id: 'r16-6', team1: getTeam('D', 1), team2: getTeam('C', 2) },
    { id: 'r16-7', team1: getTeam('F', 1), team2: getTeam('E', 2) }, { id: 'r16-8', team1: getTeam('H', 1), team2: getTeam('G', 2) },
  ], [simulatedGroups]);

  const qf_teams = React.useMemo(() => ({
    'qf-1': [findTeamById(knockoutSelections['r16-1']), findTeamById(knockoutSelections['r16-2'])], 'qf-2': [findTeamById(knockoutSelections['r16-3']), findTeamById(knockoutSelections['r16-4'])],
    'qf-3': [findTeamById(knockoutSelections['r16-5']), findTeamById(knockoutSelections['r16-6'])], 'qf-4': [findTeamById(knockoutSelections['r16-7']), findTeamById(knockoutSelections['r16-8'])],
  }), [knockoutSelections, allTeams]);

  const sf_teams = React.useMemo(() => ({
    'sf-1': [findTeamById(knockoutSelections['qf-1']), findTeamById(knockoutSelections['qf-2'])], 'sf-2': [findTeamById(knockoutSelections['qf-3']), findTeamById(knockoutSelections['qf-4'])],
  }), [knockoutSelections, allTeams]);

  const final_teams = React.useMemo(() => [findTeamById(knockoutSelections['sf-1']), findTeamById(knockoutSelections['sf-2'])], [knockoutSelections, allTeams]);
  const third_place_teams = React.useMemo(() => [getLoser(sf_teams['sf-1'][0], sf_teams['sf-1'][1], knockoutSelections['sf-1']), getLoser(sf_teams['sf-2'][0], sf_teams['sf-2'][1], knockoutSelections['sf-2'])], [knockoutSelections, sf_teams]);
  
  const champion = findTeamById(knockoutSelections['final']);
  const runnerUp = getLoser(final_teams[0], final_teams[1], knockoutSelections['final']);
  const thirdPlace = findTeamById(knockoutSelections['third_place']);
  const fourthPlace = getLoser(third_place_teams[0], third_place_teams[1], knockoutSelections['third_place']);

  return (
    <Card id="knockout-bracket-card" className="print:border-none print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between print-hidden">
        <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
      </CardHeader>
      {/* Container principal com Flexbox */}
      <CardContent className="flex justify-between space-x-2 md:space-x-4 print:space-x-2">
        
        {/* Coluna Oitavas */}
        <div className="flex flex-col w-1/4 space-y-2">
          <h3 className="font-bold text-lg text-center print:text-xs">Oitavas</h3>
          {r16.map(match => <StaticMatchup key={match.id} {...match} title={`Oitavas ${match.id.slice(-1)}`} winnerId={knockoutSelections[match.id]} />)}
        </div>

        {/* Coluna Quartas */}
        <div className="flex flex-col w-1/4 justify-around">
          <h3 className="font-bold text-lg text-center print:text-xs">Quartas</h3>
          {Object.entries(qf_teams).map(([id, teams]) => <Matchup key={id} matchId={id} title={`Quartas ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />)}
        </div>

        {/* Coluna Semifinais */}
        <div className="flex flex-col w-1/4 justify-around">
           <h3 className="font-bold text-lg text-center print:text-xs">Semifinais</h3>
           {Object.entries(sf_teams).map(([id, teams]) => <Matchup key={id} matchId={id} title={`Semi ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />)}
        </div>
        
        {/* Coluna Finais */}
        <div className="flex flex-col w-1/4 justify-around">
          <h3 className="font-bold text-lg text-center print:text-xs">Finais</h3>
          <div>
            <Matchup matchId='final' title='Final' team1={final_teams[0]} team2={final_teams[1]} selectedValue={knockoutSelections['final']} onSelect={(val) => onSelectionChange('final', val)} />
            {champion && runnerUp && (
              <div className="mt-2 space-y-1 text-center print-hidden">
                  <Button size="sm" className="w-full bg-green-600" onClick={() => onAdoptFinalPrediction('champion', champion.teamId)}>Adotar {champion.teamName} como Campeão</Button>
                  <Button size="sm" className="w-full bg-orange-600" onClick={() => onAdoptFinalPrediction('runner_up', runnerUp.teamId)}>Adotar {runnerUp.teamName} como Vice</Button>
              </div>
            )}
          </div>
          <div>
            <Matchup matchId='third_place' title='Disputa 3º Lugar' team1={third_place_teams[0]} team2={third_place_teams[1]} selectedValue={knockoutSelections['third_place']} onSelect={(val) => onSelectionChange('third_place', val)} />
             {thirdPlace && fourthPlace && (
                <div className="mt-2 space-y-1 text-center print-hidden">
                    <Button size="sm" className="w-full bg-yellow-600" onClick={() => onAdoptFinalPrediction('third_place', thirdPlace.teamId)}>Adotar {thirdPlace.teamName} como 3º</Button>
                    <Button size="sm" className="w-full bg-gray-500 text-white" onClick={() => onAdoptFinalPrediction('fourth_place', fourthPlace.teamId)}>Adotar {fourthPlace.teamName} como 4º</Button>
                </div>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;