// src/components/simulation/KnockoutBracket.tsx - VERSÃO ATUALIZADA

import React from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Tipos e Interfaces ---
interface KnockoutBracketProps {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string | null) => void;
  // ATUALIZADO: A prop agora espera todos os dados de uma vez
  onAdoptAllFinalPredictions: (
    championId: string, 
    runnerUpId: string, 
    thirdPlaceId: string, 
    fourthPlaceId: string,
    finalHomeScore: number,
    finalAwayScore: number
  ) => void;
  allTeams: SimulatedTeamStats[];
}

interface MatchupProps {
  title: string;
  matchId: string; // Adicionado para garantir que a chave seja única e acessível
  team1?: SimulatedTeamStats;
  team2?: SimulatedTeamStats;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

// --- Componentes Auxiliares (com pequenas melhorias) ---
const Matchup: React.FC<MatchupProps> = ({ title, matchId, team1, team2, selectedValue, onSelect }) => {
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
  
// --- Componente Principal ---
const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  simulatedGroups,
  knockoutSelections,
  onSelectionChange,
  onAdoptAllFinalPredictions,
  allTeams,
}) => {
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
  const allFinalPositionsSet = champion && runnerUp && thirdPlace && fourthPlace;

  const handleAdoptClick = () => {
    if (allFinalPositionsSet) {
      // Por padrão, adota 0x0 como placar da final, já que não é definido aqui.
      onAdoptAllFinalPredictions(champion.teamId, runnerUp.teamId, thirdPlace.teamId, fourthPlace.teamId, 0, 0);
    }
  };

  return (
    <Card id="knockout-bracket-card" className="print:border-none print:shadow-none">
      <CardHeader className="flex-row items-center justify-between print-hidden">
        <CardTitle className="text-2xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
        {allFinalPositionsSet && (
          <Button onClick={handleAdoptClick}>
            <Save className="mr-2 h-4 w-4" />
            Adotar Palpites Finais
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex justify-between space-x-2 md:space-x-4 print:space-x-2">
        <div className="flex flex-col w-1/4 space-y-2">
          <h3 className="text-lg font-bold text-center print:text-xs">Oitavas</h3>
          {r16.map(match => (
            <Matchup
              key={match.id}
              matchId={match.id}
              title={`Oitavas ${match.id.slice(-1)}`}
              team1={match.team1}
              team2={match.team2}
              selectedValue={knockoutSelections[match.id]}
              onSelect={(teamId) => onSelectionChange(match.id, teamId)}
            />
          ))}
        </div>

        <div className="flex flex-col w-1/4 justify-around">
          <h3 className="text-lg font-bold text-center print:text-xs">Quartas</h3>
          {Object.entries(qf_teams).map(([id, teams]) => <Matchup key={id} matchId={id} title={`Quartas ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />)}
        </div>

        <div className="flex flex-col w-1/4 justify-around">
          <h3 className="text-lg font-bold text-center print:text-xs">Semifinais</h3>
          {Object.entries(sf_teams).map(([id, teams]) => <Matchup key={id} matchId={id} title={`Semi ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />)}
        </div>
        
        <div className="flex flex-col w-1/4 justify-around">
          <h3 className="text-lg font-bold text-center print:text-xs">Finais</h3>
          <Matchup matchId='final' title='Final' team1={final_teams[0]} team2={final_teams[1]} selectedValue={knockoutSelections['final']} onSelect={(val) => onSelectionChange('final', val)} />
          <Matchup matchId='third_place' title='Disputa 3º Lugar' team1={third_place_teams[0]} team2={third_place_teams[1]} selectedValue={knockoutSelections['third_place']} onSelect={(val) => onSelectionChange('third_place', val)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;