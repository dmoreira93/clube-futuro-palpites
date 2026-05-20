import React from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KnockoutBracketProps {
  simulatedGroups: SimulatedGroup[];
  knockoutSelections: { [matchId: string]: string };
  onSelectionChange: (matchId: string, teamId: string | null) => void;
  onAdoptAllFinalPredictions: (
    championId: string, 
    runnerUpId: string, 
    thirdPlaceId: string, 
    fourthPlaceId: string,
    finalHomeScore: number,
    finalAwayScore: number
  ) => void;
  allTeams: SimulatedTeamStats[];
  isDeadlinePassed: boolean;
}

interface MatchupProps {
  title: string;
  matchId: string;
  team1?: SimulatedTeamStats;
  team2?: SimulatedTeamStats;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

const Matchup: React.FC<MatchupProps> = ({ title, matchId, team1, team2, selectedValue, onSelect }) => {
    const canSelect = team1 && team2 && team1.teamId !== team2.teamId;
    return (
      <div className="border p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm h-[68px] flex flex-col justify-center my-1">
        <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 text-[11px] uppercase">{title}</p>
        <Select onValueChange={onSelect} value={selectedValue || ""} disabled={!canSelect}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder={canSelect ? "Escolha quem avança" : "Aguardando..."} />
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
  
const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  simulatedGroups,
  knockoutSelections,
  onSelectionChange,
  onAdoptAllFinalPredictions,
  allTeams,
  isDeadlinePassed,
}) => {
  const getTeam = (groupLetter: string, position: number) => {
    const group = simulatedGroups.find(g => {
      const name = g.groupName?.toUpperCase() || "";
      return name === groupLetter || name === `GRUPO ${groupLetter}`;
    });
    return group?.standings[position - 1];
  };

  const findTeamById = (teamId?: string) => teamId ? allTeams.find(t => t.teamId === teamId) : undefined;
  
  const getLoser = (team1?: SimulatedTeamStats, team2?: SimulatedTeamStats, winnerId?: string) => {
    if (!team1 || !team2 || !winnerId) return undefined;
    return winnerId === team1.teamId ? team2 : team1;
  };

  // --- CRUZAMENTO CONFIGURADO DA FASE DE 32 SELEÇÕES (1º vs 2º alternados) ---
  const r32 = React.useMemo(() => [
    { id: 'r32-1', title: 'Jogo 1', team1: getTeam('A', 1), team2: getTeam('B', 2) },
    { id: 'r32-2', title: 'Jogo 2', team1: getTeam('C', 1), team2: getTeam('D', 2) },
    { id: 'r32-3', title: 'Jogo 3', team1: getTeam('E', 1), team2: getTeam('F', 2) },
    { id: 'r32-4', title: 'Jogo 4', team1: getTeam('G', 1), team2: getTeam('H', 2) },
    { id: 'r32-5', title: 'Jogo 5', team1: getTeam('I', 1), team2: getTeam('J', 2) },
    { id: 'r32-6', title: 'Jogo 6', team1: getTeam('K', 1), team2: getTeam('L', 2) },
    { id: 'r32-7', title: 'Jogo 7', team1: getTeam('B', 1), team2: getTeam('A', 2) },
    { id: 'r32-8', title: 'Jogo 8', team1: getTeam('D', 1), team2: getTeam('C', 2) },
    { id: 'r32-9', title: 'Jogo 9', team1: getTeam('F', 1), team2: getTeam('E', 2) },
    { id: 'r32-10', title: 'Jogo 10', team1: getTeam('H', 1), team2: getTeam('G', 2) },
    { id: 'r32-11', title: 'Jogo 11', team1: getTeam('J', 1), team2: getTeam('I', 2) },
    { id: 'r32-12', title: 'Jogo 12', team1: getTeam('L', 1), team2: getTeam('K', 2) },
    // Slots para os melhores 3º colocados cruzarem com os cabeças de chave restantes
    { id: 'r32-13', title: 'Jogo 13 (3º colocado)', team1: getTeam('A', 1), team2: allTeams[0] },
    { id: 'r32-14', title: 'Jogo 14 (3º colocado)', team1: getTeam('B', 1), team2: allTeams[1] },
    { id: 'r32-15', title: 'Jogo 15 (3º colocado)', team1: getTeam('C', 1), team2: allTeams[2] },
    { id: 'r32-16', title: 'Jogo 16 (3º colocado)', team1: getTeam('D', 1), team2: allTeams[3] },
  ], [simulatedGroups, allTeams]);

  // --- AS OITAVAS DE FINAL HERDAM OS VENCEDORES SELECIONADOS NA FASE DE 32 ---
  const r16_teams = React.useMemo(() => ({
    'r16-1': [findTeamById(knockoutSelections['r32-1']), findTeamById(knockoutSelections['r32-2'])],
    'r16-2': [findTeamById(knockoutSelections['r32-3']), findTeamById(knockoutSelections['r32-4'])],
    'r16-3': [findTeamById(knockoutSelections['r32-5']), findTeamById(knockoutSelections['r32-6'])],
    'r16-4': [findTeamById(knockoutSelections['r32-7']), findTeamById(knockoutSelections['r32-8'])],
    'r16-5': [findTeamById(knockoutSelections['r32-9']), findTeamById(knockoutSelections['r32-10'])],
    'r16-6': [findTeamById(knockoutSelections['r32-11']), findTeamById(knockoutSelections['r32-12'])],
    'r16-7': [findTeamById(knockoutSelections['r32-13']), findTeamById(knockoutSelections['r32-14'])],
    'r16-8': [findTeamById(knockoutSelections['r32-15']), findTeamById(knockoutSelections['r32-16'])],
  }), [knockoutSelections, allTeams]);

  const qf_teams = React.useMemo(() => ({
    'qf-1': [findTeamById(knockoutSelections['r16-1']), findTeamById(knockoutSelections['r16-2'])],
    'qf-2': [findTeamById(knockoutSelections['r16-3']), findTeamById(knockoutSelections['r16-4'])],
    'qf-3': [findTeamById(knockoutSelections['r16-5']), findTeamById(knockoutSelections['r16-6'])],
    'qf-4': [findTeamById(knockoutSelections['r16-7']), findTeamById(knockoutSelections['r16-8'])],
  }), [knockoutSelections, allTeams]);

  const sf_teams = React.useMemo(() => ({
    'sf-1': [findTeamById(knockoutSelections['qf-1']), findTeamById(knockoutSelections['qf-2'])],
    'sf-2': [findTeamById(knockoutSelections['qf-3']), findTeamById(knockoutSelections['qf-4'])],
  }), [knockoutSelections, allTeams]);

  const final_teams = React.useMemo(() => [
    findTeamById(knockoutSelections['sf-1']), 
    findTeamById(knockoutSelections['sf-2'])
  ], [knockoutSelections, allTeams]);

  const third_place_teams = React.useMemo(() => [
    getLoser(sf_teams['sf-1'][0], sf_teams['sf-1'][1], knockoutSelections['sf-1']), 
    getLoser(sf_teams['sf-2'][0], sf_teams['sf-2'][1], knockoutSelections['sf-2'])
  ], [knockoutSelections, sf_teams]);
  
  const champion = findTeamById(knockoutSelections['final']);
  const runnerUp = getLoser(final_teams[0], final_teams[1], knockoutSelections['final']);
  const thirdPlace = findTeamById(knockoutSelections['third_place']);
  const fourthPlace = getLoser(third_place_teams[0], third_place_teams[1], knockoutSelections['third_place']);
  const allFinalPositionsSet = champion && runnerUp && thirdPlace && fourthPlace;

  const handleAdoptClick = () => {
    if (allFinalPositionsSet) {
      onAdoptAllFinalPredictions(champion.teamId, runnerUp.teamId, thirdPlace.teamId, fourthPlace.teamId, 0, 0);
    }
  };

  return (
    <Card id="knockout-bracket-card" className="print:border-none print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-fifa-blue">Chaveamento do Mata-Mata (FIFA 2026)</CardTitle>
        {allFinalPositionsSet && (
          <Button onClick={handleAdoptClick} disabled={isDeadlinePassed}>
            <Save className="mr-2 h-4 w-4" />
            {isDeadlinePassed ? 'Prazo Encerrado' : 'Adotar Palpites Finais'}
          </Button>
        )}
      </CardHeader>

      <CardContent className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] justify-between">
          
          {/* FASE DE 32 SELEÇÕES */}
          <div className="flex flex-col w-1/5 space-y-1">
            <h3 className="text-xs font-black text-center bg-slate-950 text-white py-1 rounded uppercase">Fase de 32</h3>
            {r32.map(match => (
              <Matchup
                key={match.id}
                matchId={match.id}
                title={match.title}
                team1={match.team1}
                team2={match.team2}
                selectedValue={knockoutSelections[match.id]}
                onSelect={(teamId) => onSelectionChange(match.id, teamId)}
              />
            ))}
          </div>

          {/* OITAVAS DE FINAL */}
          <div className="flex flex-col w-1/5 justify-around">
            <h3 className="text-xs font-black text-center bg-fifa-blue text-white py-1 rounded uppercase mb-2">Oitavas</h3>
            {Object.entries(r16_teams).map(([id, teams]) => (
              <Matchup key={id} matchId={id} title={`Oitavas ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />
            ))}
          </div>

          {/* QUARTAS DE FINAL */}
          <div className="flex flex-col w-1/5 justify-around">
            <h3 className="text-xs font-black text-center bg-slate-800 text-white py-1 rounded uppercase mb-2">Quartas</h3>
            {Object.entries(qf_teams).map(([id, teams]) => (
              <Matchup key={id} matchId={id} title={`Quartas ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />
            ))}
          </div>

          {/* SEMIFINAIS */}
          <div className="flex flex-col w-1/5 justify-around">
            <h3 className="text-xs font-black text-center bg-slate-700 text-white py-1 rounded uppercase mb-2">Semifinais</h3>
            {Object.entries(sf_teams).map(([id, teams]) => (
              <Matchup key={id} matchId={id} title={`Semi ${id.slice(-1)}`} team1={teams[0]} team2={teams[1]} selectedValue={knockoutSelections[id]} onSelect={(val) => onSelectionChange(id, val)} />
            ))}
          </div>
          
          {/* FINAIS */}
          <div className="flex flex-col w-1/5 justify-center gap-4 border-l pl-2 border-dashed border-gray-300">
            <h3 className="text-xs font-black text-center bg-emerald-600 text-white py-1 rounded uppercase">Finais</h3>
            <Matchup matchId='final' title='🥇 Final' team1={final_teams[0]} team2={final_teams[1]} selectedValue={knockoutSelections['final']} onSelect={(val) => onSelectionChange('final', val)} />
            <Matchup matchId='third_place' title='🥉 3º Lugar' team1={third_place_teams[0]} team2={third_place_teams[1]} selectedValue={knockoutSelections['third_place']} onSelect={(val) => onSelectionChange('third_place', val)} />
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;