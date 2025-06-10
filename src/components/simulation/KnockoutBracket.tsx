// src/components/simulation/KnockoutBracket.tsx

import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string) => void;
  onAdoptFinalPrediction: (role: 'champion' | 'runner_up' | 'third_place', teamId: string | undefined) => void;
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

  const findTeamById = (teamId?: string): SimulatedTeamStats | undefined => {
    if (!teamId) return undefined;
    return allTeams.find(t => t.teamId === teamId);
  };

  // **CORREÇÃO: A função getLoser foi movida para o escopo principal do componente**
  const getLoser = (matchDependsOn: [string, string], winnerId: string | undefined): SimulatedTeamStats | undefined => {
    const t1 = findTeamById(knockoutSelections[matchDependsOn[0]]);
    const t2 = findTeamById(knockoutSelections[matchDependsOn[1]]);
    if (!t1 || !t2 || !winnerId) return undefined;
    return winnerId === t1.teamId ? t2 : t1;
  }

  // --- Estrutura do Chaveamento ---
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

  const qf_sf_final_structure = {
    qf: [
      { id: 'qf-1', title: 'Quartas 1', dependsOn: ['r16-1', 'r16-2'] as [string, string] },
      { id: 'qf-2', title: 'Quartas 2', dependsOn: ['r16-3', 'r16-4'] as [string, string] },
      { id: 'qf-3', title: 'Quartas 3', dependsOn: ['r16-5', 'r16-6'] as [string, string] },
      { id: 'qf-4', title: 'Quartas 4', dependsOn: ['r16-7', 'r16-8'] as [string, string] },
    ],
    sf: [
      { id: 'sf-1', title: 'Semi 1', dependsOn: ['qf-1', 'qf-2'] as [string, string] },
      { id: 'sf-2', title: 'Semi 2', dependsOn: ['qf-3', 'qf-4'] as [string, string] },
    ],
    final: { id: 'final', title: 'Final', dependsOn: ['sf-1', 'sf-2'] as [string, string] },
    third_place: { id: 'third_place', title: 'Disputa 3º Lugar', dependsOn: ['sf-1', 'sf-2'] as [string, string] },
  };

  const champion = findTeamById(knockoutSelections['final']);
  const runnerUp = getLoser(qf_sf_final_structure.final.dependsOn, knockoutSelections['final']);
  const thirdPlace = findTeamById(knockoutSelections['third_place']);

  // --- Componentes de Exibição ---

  const InteractiveMatchup = ({ matchId, title, dependsOn }: { matchId: string, title: string, dependsOn: [string, string] }) => {
    // Lógica específica para a disputa de 3º lugar
    const isThirdPlaceMatch = matchId === 'third_place';
    const sf1_winner = knockoutSelections['sf-1'];
    const sf2_winner = knockoutSelections['sf-2'];

    const team1_base = findTeamById(knockoutSelections[dependsOn[0]]);
    const team2_base = findTeamById(knockoutSelections[dependsOn[1]]);

    const team1 = isThirdPlaceMatch ? getLoser(['qf-1', 'qf-2'], sf1_winner) : team1_base;
    const team2 = isThirdPlaceMatch ? getLoser(['qf-3', 'qf-4'], sf2_winner) : team2_base;

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

  const StaticMatchup = ({ team1, team2, title, winnerId }: { team1?: SimulatedTeamStats, team2?: SimulatedTeamStats, title: string, winnerId?: string }) => (
    <div className="border p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm h-[68px] flex flex-col justify-center">
      <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
      <div className="space-y-1">
        <p className={winnerId === team1?.teamId ? 'font-bold text-green-600' : 'text-gray-500'}>{team1?.teamName || 'A definir'}</p>
        <p className={winnerId === team2?.teamId ? 'font-bold text-green-600' : 'text-gray-500'}>{team2?.teamName || 'A definir'}</p>
      </div>
    </div>
  );

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
          {r16.map(match => <StaticMatchup key={match.id} {...match} winnerId={knockoutSelections[match.id]} />)}
        </div>
        {/* Quartas */}
        <div className="space-y-[6.5rem]">
          <h3 className="font-bold text-lg text-center">Quartas de Final</h3>
          {qf_sf_final_structure.qf.map(match => <InteractiveMatchup key={match.id} {...match} />)}
        </div>
        {/* Semis */}
        <div className="space-y-[15.5rem]">
          <h3 className="font-bold text-lg text-center">Semifinais</h3>
          {qf_sf_final_structure.sf.map(match => <InteractiveMatchup key={match.id} {...match} />)}
        </div>
        {/* Finais */}
        <div className="space-y-8">
          <h3 className="font-bold text-lg text-center">Final</h3>
          <div className="md:mt-[18rem]">
            <InteractiveMatchup {...qf_sf_final_structure.final} />
            {champion && runnerUp && (
              <div className="mt-2 space-y-1 text-center">
                  <Button size="sm" className="w-full bg-green-600" onClick={() => onAdoptFinalPrediction('champion', champion.teamId)}>Adotar {champion.teamName} como Campeão</Button>
                  <Button size="sm" className="w-full bg-orange-600" onClick={() => onAdoptFinalPrediction('runner_up', runnerUp.teamId)}>Adotar {runnerUp.teamName} como Vice</Button>
              </div>
            )}
          </div>
          <div className="md:mt-[10rem]">
            <InteractiveMatchup {...qf_sf_final_structure.third_place} />
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