// src/components/simulation/KnockoutBracket.tsx

import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipos para as props atualizadas
interface Props {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string) => void;
  onAdoptFinalPrediction: (role: 'champion' | 'runner_up' | 'third_place' | 'fourth_place', teamId: string) => void;
  allTeams: SimulatedTeamStats[];
}

const KnockoutBracket = ({
  simulatedGroups,
  knockoutSelections,
  onSelectionChange,
  onAdoptFinalPrediction,
  allTeams,
}: Props) => {
  // --- Funções Auxiliares ---
  const getTeam = (groupName: string, position: number): SimulatedTeamStats | undefined => {
    return simulatedGroups.find(g => g.groupName === groupName)?.standings[position - 1];
  };

  const findTeamById = (teamId: string): SimulatedTeamStats | undefined => {
    return allTeams.find(t => t.teamId === teamId);
  };

  // --- Estrutura do Chaveamento ---
  const r16 = [
    { id: 'r16-1', team1: getTeam('A', 1), team2: getTeam('B', 2) },
    { id: 'r16-2', team1: getTeam('C', 1), team2: getTeam('D', 2) },
    { id: 'r16-3', team1: getTeam('E', 1), team2: getTeam('F', 2) },
    { id: 'r16-4', team1: getTeam('G', 1), team2: getTeam('H', 2) },
    { id: 'r16-5', team1: getTeam('B', 1), team2: getTeam('A', 2) },
    { id: 'r16-6', team1: getTeam('D', 1), team2: getTeam('C', 2) },
    { id: 'r16-7', team1: getTeam('F', 1), team2: getTeam('E', 2) },
    { id: 'r16-8', team1: getTeam('H', 1), team2: getTeam('G', 2) },
  ];

  const qf = [
    { id: 'qf-1', team1: findTeamById(knockoutSelections['r16-1']), team2: findTeamById(knockoutSelections['r16-2']) },
    { id: 'qf-2', team1: findTeamById(knockoutSelections['r16-3']), team2: findTeamById(knockoutSelections['r16-4']) },
    { id: 'qf-3', team1: findTeamById(knockoutSelections['r16-5']), team2: findTeamById(knockoutSelections['r16-6']) },
    { id: 'qf-4', team1: findTeamById(knockoutSelections['r16-7']), team2: findTeamById(knockoutSelections['r16-8']) },
  ];

  const sf = [
    { id: 'sf-1', team1: findTeamById(knockoutSelections['qf-1']), team2: findTeamById(knockoutSelections['qf-2']) },
    { id: 'sf-2', team1: findTeamById(knockoutSelections['qf-3']), team2: findTeamById(knockoutSelections['qf-4']) },
  ];
  
  const finalWinner = findTeamById(knockoutSelections['sf-1']);
  const finalLoser = findTeamById(knockoutSelections['sf-2']);

  // --- Componente Reutilizável para Confronto ---
  const Matchup = ({ matchId, team1, team2, title }: { matchId: string, team1?: SimulatedTeamStats, team2?: SimulatedTeamStats, title: string }) => {
    const canSelect = team1 && team2;
    return (
      <div className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm h-[68px] flex flex-col justify-center">
        <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
        <Select
          onValueChange={(value) => onSelectionChange(matchId, value)}
          value={knockoutSelections[matchId] || ""}
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

  return (
    <Card id="printable-bracket">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl md:text-3xl font-bold text-fifa-blue">Chaveamento do Mata-Mata</CardTitle>
        <Button variant="outline" onClick={() => window.print()} className="print-hidden">
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Oitavas */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Oitavas de Final</h3>
          {r16.map(match => <Matchup key={match.id} {...match} title={match.id.replace('r16-','Oitavas ')} />)}
        </div>
        {/* Quartas */}
        <div className="space-y-[6.5rem]">
          <h3 className="font-bold text-lg text-center">Quartas de Final</h3>
          {qf.map(match => <Matchup key={match.id} {...match} title={match.id.replace('qf-','Quartas ')} />)}
        </div>
        {/* Semis */}
        <div className="space-y-[15.5rem]">
           <h3 className="font-bold text-lg text-center">Semifinais</h3>
           {sf.map(match => <Matchup key={match.id} {...match} title={match.id.replace('sf-','Semi ')} />)}
        </div>
        {/* Finais */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Final</h3>
          <div className="md:mt-[18rem]">
            {finalWinner && finalLoser ? (
              <div className="border p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-center">
                <p className="font-bold">FINAL</p>
                <p className='text-lg font-bold text-green-600'>{findTeamById(knockoutSelections['sf-1'])?.teamName}</p>
                <p className="text-sm">vs</p>
                <p className='text-lg font-bold text-orange-600'>{findTeamById(knockoutSelections['sf-2'])?.teamName}</p>
                <div className="mt-2 space-y-1">
                  <Button size="sm" className="w-full bg-green-600" onClick={() => onAdoptFinalPrediction('champion', knockoutSelections['sf-1'])}>Adotar Campeão</Button>
                  <Button size="sm" className="w-full bg-orange-600" onClick={() => onAdoptFinalPrediction('runner_up', knockoutSelections['sf-2'])}>Adotar Vice</Button>
                </div>
              </div>
            ) : <div className="text-center text-xs text-gray-500 pt-16">Aguardando semis...</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;