// src/components/simulation/KnockoutBracket.tsx
import React from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- MOTOR DE ÍNDICE TÉCNICO COMPLETO DOS 3º COLOCADOS ---
export function obterMelhoresTerceiros(simulatedGroups: SimulatedGroup[]): { teams: any[], hasTie: boolean } {
  const terceiros = simulatedGroups
    .map(g => {
      const terceiroDoGrupo = g.standings[2];
      // Garante a extração limpa da letra do grupo independente do formato da string
      const nomeLimpo = (g.groupName || '').trim().toUpperCase();
      const letra = nomeLimpo.startsWith('GRUPO') || nomeLimpo.startsWith('GROUP') 
        ? nomeLimpo.split(' ').pop() || '' 
        : nomeLimpo;

      return terceiroDoGrupo ? { 
        ...terceiroDoGrupo, 
        groupLetter: letra.trim()
      } : null;
    })
    .filter((t): t is any => t !== null && t !== undefined);

  let hasTie = false;

  terceiros.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.wins !== a.wins) return b.wins - a.wins;

    hasTie = true; 
    return 0;
  });

  return {
    teams: terceiros,
    hasTie
  };
}

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
        <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 text-[10px] uppercase truncate">{title}</p>
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

  // --- BUSCA DA LISTA DE TERCEIROS ORDENADOS POR ÍNDICE TÉCNICO ---
  const { melhoresTerceiros, existeEmpateNosCriterios } = React.useMemo(() => {
    const resultado = obterMelhoresTerceiros(simulatedGroups);
    return { melhoresTerceiros: resultado.teams, existeEmpateNosCriterios: resultado.hasTie };
  }, [simulatedGroups]);

  // --- MOTOR ALGORÍTMICO DINÂMICO DA FIFA (PROJETADO PARA AS 495 COMBINAÇÕES COMBINATÓRIAS) ---
  const r32 = React.useMemo(() => {
    // Isola unicamente os 8 melhores terceiros colocados da classificação geral
    let terceirosDisponiveis = [...melhoresTerceiros.slice(0, 8)];

    // Varre e drena o melhor terceiro elegível respeitando a prioridade vertical de chaves da FIFA
    const alocarTerceiroUniversal = (gruposPermitidos: string[], idxFallback: number) => {
      const idx = terceirosDisponiveis.findIndex(t => gruposPermitidos.includes(t.groupLetter));
      if (idx !== -1) {
        return terceirosDisponiveis.splice(idx, 1)[0];
      }
      return melhoresTerceiros[idxFallback] || allTeams[idxFallback];
    };

    // Alocação sequencial com base nas travas de elegibilidade do regulamento oficial da Copa de 2026
    return [
      // --- LADO ESQUERDO DO DESIGN DA CHAVE ---
      { id: 'r32-1',  title: 'Jogo 74', team1: getTeam('E', 1), team2: alocarTerceiroUniversal(['A','B','C','D','F'], 0) }, // 1E vs 3ABCDF
      { id: 'r32-2',  title: 'Jogo 77', team1: getTeam('I', 1), team2: alocarTerceiroUniversal(['C','D','F','G','H'], 1) }, // 1I vs 3CDFGH
      { id: 'r32-3',  title: 'Jogo 73', team1: getTeam('A', 2), team2: getTeam('B', 2) },                             // 2A vs 2B
      { id: 'r32-4',  title: 'Jogo 75', team1: getTeam('F', 1), team2: getTeam('C', 2) },                             // 1F vs 2C
      { id: 'r32-5',  title: 'Jogo 83', team1: getTeam('K', 2), team2: getTeam('L', 2) },                             // 2K vs 2L
      { id: 'r32-6',  title: 'Jogo 84', team1: getTeam('H', 1), team2: getTeam('J', 2) },                             // 1H vs 2J
      { id: 'r32-7',  title: 'Jogo 81', team1: getTeam('D', 1), team2: alocarTerceiroUniversal(['B','E','F','I','J'], 2) }, // 1D vs 3BEFIJ
      { id: 'r32-8',  title: 'Jogo 82', team1: getTeam('G', 1), team2: alocarTerceiroUniversal(['A','E','H','I','J'], 3) }, // 1G vs 3AEHIJ

      // --- LADO DIREITO DO DESIGN DA CHAVE ---
      { id: 'r32-9',  title: 'Jogo 76', team1: getTeam('C', 1), team2: getTeam('F', 2) },                             // 1C vs 2F
      { id: 'r32-10', title: 'Jogo 78', team1: getTeam('E', 2), team2: getTeam('I', 2) },                             // 2E vs 2I
      { id: 'r32-11', title: 'Jogo 79', team1: getTeam('A', 1), team2: alocarTerceiroUniversal(['C','E','F','H','I'], 4) }, // 1A vs 3CEFHI
      { id: 'r32-12', title: 'Jogo 80', team1: getTeam('L', 1), team2: alocarTerceiroUniversal(['E','H','I','J','K'], 5) }, // 1L vs 3EHIJK
      { id: 'r32-13', title: 'Jogo 86', team1: getTeam('J', 1), team2: getTeam('H', 2) },                             // 1J vs 2H
      { id: 'r32-14', title: 'Jogo 88', team1: getTeam('D', 2), team2: getTeam('G', 2) },                             // 2D vs 2G
      { id: 'r32-15', title: 'Jogo 85', team1: getTeam('B', 1), team2: alocarTerceiroUniversal(['E','F','G','I','J'], 6) }, // 1B vs 3EFGIJ
      { id: 'r32-16', title: 'Jogo 87', team1: getTeam('K', 1), team2: alocarTerceiroUniversal(['D','E','I','J','L'], 7) }, // 1K vs 3DEIJL
    ];
  }, [simulatedGroups, melhoresTerceiros, allTeams]);

  // --- MAPEAMENTO DAS OITAVAS SEGUINDO A PLANILHA OFICIAL ---
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
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold text-fifa-blue">Chaveamento do Mata-Mata (FIFA 2026)</CardTitle>
        </div>
        {allFinalPositionsSet && (
          <Button onClick={handleAdoptClick} disabled={isDeadlinePassed}>
            <Save className="mr-2 h-4 w-4" />
            {isDeadlinePassed ? 'Prazo Encerrado' : 'Adotar Palpites Finais'}
          </Button>
        )}
      </CardHeader>

      <CardContent className="overflow-x-auto pb-4">
        {existeEmpateNosCriterios && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md mb-4">
            ⚠️ <strong>Empate de Índice Técnico Detectado:</strong> Dois ou mais times possuem a mesma pontuação, saldo e gols marcados. O sistema aplicou a ordem base, mas você pode definir quem avança nos blocos!
          </div>
        )}

        <div className="flex gap-4 min-w-[1300px] justify-between">
          
          {/* COLUNA 1: SEGUNDA FASE */}
          <div className="flex flex-col w-1/5 space-y-1">
            <h3 className="text-xs font-black text-center bg-slate-950 text-white py-1 rounded uppercase">Segundas de Final</h3>
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

          {/* COLUNA 2: OITAVAS DE FINAL */}
          <div className="flex flex-col w-1/5 justify-around">
            <h3 className="text-xs font-black text-center bg-fifa-blue text-white py-1 rounded uppercase mb-2">Oitavas de final</h3>
            <Matchup matchId="r16-1" title="Jogo 89" team1={r16_teams['r16-1'][0]} team2={r16_teams['r16-1'][1]} selectedValue={knockoutSelections['r16-1']} onSelect={(val) => onSelectionChange('r16-1', val)} />
            <Matchup matchId="r16-2" title="Jogo 90" team1={r16_teams['r16-2'][0]} team2={r16_teams['r16-2'][1]} selectedValue={knockoutSelections['r16-2']} onSelect={(val) => onSelectionChange('r16-2', val)} />
            <Matchup matchId="r16-3" title="Jogo 93" team1={r16_teams['r16-3'][0]} team2={r16_teams['r16-3'][1]} selectedValue={knockoutSelections['r16-3']} onSelect={(val) => onSelectionChange('r16-3', val)} />
            <Matchup matchId="r16-4" title="Jogo 94" team1={r16_teams['r16-4'][0]} team2={r16_teams['r16-4'][1]} selectedValue={knockoutSelections['r16-4']} onSelect={(val) => onSelectionChange('r16-4', val)} />
            <Matchup matchId="r16-5" title="Jogo 91" team1={r16_teams['r16-5'][0]} team2={r16_teams['r16-5'][1]} selectedValue={knockoutSelections['r16-5']} onSelect={(val) => onSelectionChange('r16-5', val)} />
            <Matchup matchId="r16-6" title="Jogo 92" team1={r16_teams['r16-6'][0]} team2={r16_teams['r16-6'][1]} selectedValue={knockoutSelections['r16-6']} onSelect={(val) => onSelectionChange('r16-6', val)} />
            <Matchup matchId="r16-7" title="Jogo 95" team1={r16_teams['r16-7'][0]} team2={r16_teams['r16-7'][1]} selectedValue={knockoutSelections['r16-7']} onSelect={(val) => onSelectionChange('r16-7', val)} />
            <Matchup matchId="r16-8" title="Jogo 96" team1={r16_teams['r16-8'][0]} team2={r16_teams['r16-8'][1]} selectedValue={knockoutSelections['r16-8']} onSelect={(val) => onSelectionChange('r16-8', val)} />
          </div>

          {/* COLUNA 3: QUARTAS DE FINAL */}
          <div className="flex flex-col w-1/5 justify-around">
            <h3 className="text-xs font-black text-center bg-slate-800 text-white py-1 rounded uppercase mb-2">Quartas de final</h3>
            <Matchup matchId="qf-1" title="Jogo 97" team1={qf_teams['qf-1'][0]} team2={qf_teams['qf-1'][1]} selectedValue={knockoutSelections['qf-1']} onSelect={(val) => onSelectionChange('qf-1', val)} />
            <Matchup matchId="qf-2" title="Jogo 98" team1={qf_teams['qf-2'][0]} team2={qf_teams['qf-2'][1]} selectedValue={knockoutSelections['qf-2']} onSelect={(val) => onSelectionChange('qf-2', val)} />
            <Matchup matchId="qf-3" title="Jogo 99" team1={qf_teams['qf-3'][0]} team2={qf_teams['qf-3'][1]} selectedValue={knockoutSelections['qf-3']} onSelect={(val) => onSelectionChange('qf-3', val)} />
            <Matchup matchId="qf-4" title="Jogo 100" team1={qf_teams['qf-4'][0]} team2={qf_teams['qf-4'][1]} selectedValue={knockoutSelections['qf-4']} onSelect={(val) => onSelectionChange('qf-4', val)} />
          </div>

          {/* COLUNA 4: SEMIFINAIS */}
          <div className="flex flex-col w-1/5 justify-around">
            <h3 className="text-xs font-black text-center bg-slate-700 text-white py-1 rounded uppercase mb-2">Semifinal</h3>
            <Matchup matchId="sf-1" title="Jogo 101" team1={sf_teams['sf-1'][0]} team2={sf_teams['sf-1'][1]} selectedValue={knockoutSelections['sf-1']} onSelect={(val) => onSelectionChange('sf-1', val)} />
            <Matchup matchId="sf-2" title="Jogo 102" team1={sf_teams['sf-2'][0]} team2={sf_teams['sf-2'][1]} selectedValue={knockoutSelections['sf-2']} onSelect={(val) => onSelectionChange('sf-2', val)} />
          </div>
          
          {/* COLUNA 5: FINAIS */}
          <div className="flex flex-col w-1/5 justify-center gap-4 border-l pl-2 border-dashed border-gray-300">
            <h3 className="text-xs font-black text-center bg-emerald-600 text-white py-1 rounded uppercase">Finais</h3>
            <Matchup matchId='final' title='🥇 Jogo 104 (Final)' team1={final_teams[0]} team2={final_teams[1]} selectedValue={knockoutSelections['final']} onSelect={(val) => onSelectionChange('final', val)} />
            <Matchup matchId='third_place' title='🥉 Jogo 103 (3º Lugar)' team1={third_place_teams[0]} team2={third_place_teams[1]} selectedValue={knockoutSelections['third_place']} onSelect={(val) => onSelectionChange('third_place', val)} />
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default KnockoutBracket;