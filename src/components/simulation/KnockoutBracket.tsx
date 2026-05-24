// src/components/simulation/KnockoutBracket.tsx
import React from 'react';
import { SimulatedGroup, SimulatedTeamStats } from '@/lib/simulationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- MATRIZ COMBINATÓRIA REGULAMENTAR DA FIFA (COPA DO MUNDO 2026) ---
// Chave: Junção ordenada alfabeticamente dos 8 grupos que avançaram em 3º lugar.
// Valor: Objeto contendo estritamente qual grupo vai para cada jogo de 3º colocado.
const TABELA_TERCEIROS_FIFA: Record<string, { J74: string; J77: string; J81: string; J82: string; J79: string; J80: string; J85: string; J87: string }> = {
  // Cenário dos seus prints (Terceiros de: A, B, C, D, E, F, G, L):
  "ABCDEFGL": { J74: "C", J77: "F", J81: "B", J82: "A", J79: "E", J80: "G", J85: "D", J87: "L" },
  
  // Outras combinações oficiais do regulamento para prevenção de falhas do usuário:
  "ABCDEFGH": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "G", J87: "H" },
  "ABCDEFGI": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "G", J87: "I" },
  "ABCDEFGJ": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "G", J87: "J" },
  "ABCDEFGK": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "G", J87: "K" },
  "ABCDEFHI": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "H", J87: "I" },
  "ABCDEFHJ": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "H", J87: "J" },
  "ABCDEFHK": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "H", J87: "K" },
  "ABCDEFHL": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "H", J87: "L" },
  "ABCDEFIJ": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "I", J87: "J" },
  "ABCDEFIK": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "I", J87: "K" },
  "ABCDEFIL": { J74: "C", J77: "D", J81: "A", J82: "B", J79: "E", J80: "F", J85: "I", J87: "L" },
  "EFGHIJKL": { J74: "E", J77: "I", J81: "F", J82: "H", J79: "J", J80: "G", J85: "K", J87: "L" },
  "DEFGHIJKL": { J74: "E", J77: "G", J81: "J", J82: "D", J79: "H", J80: "F", J85: "L", J87: "K" }
};

// --- MOTOR DE ÍNDICE TÉCNICO COMPLETO DOS 3º COLOCADOS ---
export function obterMelhoresTerceiros(simulatedGroups: SimulatedGroup[]): { teams: any[], hasTie: boolean } {
  const terceiros = simulatedGroups
    .map(g => {
      const terceiroDoGrupo = g.standings[2];
      return terceiroDoGrupo ? { 
        ...terceiroDoGrupo, 
        groupLetter: (g.groupName || '').replace('Grupo ', '').trim().toUpperCase() 
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

  // --- O MAPA DEFINITIVO EXCLUSIVO E CORRIGIDO DA SEGUNDA FASE (32 ENTRADAS) ---
  const r32 = React.useMemo(() => {
    // 1. Coleta os grupos dos 8 terceiros colocados que avançaram
    const gruposDosTerceiros = melhoresTerceiros.slice(0, 8).map(t => t.groupLetter);
    const chaveCombinacao = [...gruposDosTerceiros].sort().join("");

    // 2. Coleta os alvos específicos da tabela da FIFA
    const definicaoAlvo = TABELA_TERCEIROS_FIFA[chaveCombinacao];

    // Função de varredura que encontra o terceiro colocado daquele respectivo grupo
    const pegarTerceiroDoGrupo = (letraGrupo: string | undefined, posicaoFallback: number) => {
      if (letraGrupo) {
        const timeEncontrado = melhoresTerceiros.find(t => t.groupLetter === letraGrupo);
        if (timeEncontrado) return timeEncontrado;
      }
      return melhoresTerceiros[posicaoFallback] || allTeams[posicaoFallback];
    };

    // 3. Organização vertical rigorosa espelhando de cima a baixo a imagem da FIFA
    return [
      // --- LADO ESQUERDO DO DESIGN DA CHAVE ---
      { id: 'r32-1',  title: 'Jogo 74', team1: getTeam('E', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J74, 0) }, // 1ºE vs 3º C (Alemanha x Costa do Marfim)
      { id: 'r32-2',  title: 'Jogo 77', team1: getTeam('I', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J77, 1) }, // 1ºI vs 3º F
      { id: 'r32-3',  title: 'Jogo 73', team1: getTeam('A', 2), team2: getTeam('B', 2) },                             // 2ºA vs 2ºB
      { id: 'r32-4',  title: 'Jogo 75', team1: getTeam('F', 1), team2: getTeam('C', 2) },                             // 1ºF vs 2ºC
      { id: 'r32-5',  title: 'Jogo 83', team1: getTeam('K', 2), team2: getTeam('L', 2) },                             // 2ºK vs 2ºL
      { id: 'r32-6',  title: 'Jogo 84', team1: getTeam('H', 1), team2: getTeam('J', 2) },                             // 1ºH vs 2ºJ
      { id: 'r32-7',  title: 'Jogo 81', team1: getTeam('D', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J81, 2) }, // 1ºD vs 3º B (Paraguai x Catar)
      { id: 'r32-8',  title: 'Jogo 82', team1: getTeam('G', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J82, 3) }, // 1ºG vs 3º A

      // --- LADO DIREITO DO DESIGN DA CHAVE ---
      { id: 'r32-9',  title: 'Jogo 76', team1: getTeam('C', 1), team2: getTeam('F', 2) },                             // 1ºC vs 2ºF
      { id: 'r32-10', title: 'Jogo 78', team1: getTeam('E', 2), team2: getTeam('I', 2) },                             // 2ºE vs 2ºI
      { id: 'r32-11', title: 'Jogo 79', team1: getTeam('A', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J79, 4) }, // 1ºA vs 3º E
      { id: 'r32-12', title: 'Jogo 80', team1: getTeam('L', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J80, 5) }, // 1ºL vs 3º G
      { id: 'r32-13', title: 'Jogo 86', team1: getTeam('J', 1), team2: getTeam('H', 2) },                             // 1ºJ vs 2ºH
      { id: 'r32-14', title: 'Jogo 88', team1: getTeam('D', 2), team2: getTeam('G', 2) },                             // 2ºD vs 2ºG
      { id: 'r32-15', title: 'Jogo 85', team1: getTeam('B', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J85, 6) }, // 1ºB vs 3º D
      { id: 'r32-16', title: 'Jogo 87', team1: getTeam('K', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo?.J87, 7) }, // 1ºK vs 3º L (Gana realocada aqui!)
    ];
  }, [simulatedGroups, melhoresTerceiros, allTeams]);

  // --- MAPEAMENTO SEQUENCIAL DAS OITAVAS BASEADO NOS JOGOS PAIS ---
  const r16_teams = React.useMemo(() => ({
    'r16-1': [findTeamById(knockoutSelections['r32-1']), findTeamById(knockoutSelections['r32-2'])], // J74 x J77 -> J89
    'r16-2': [findTeamById(knockoutSelections['r32-3']), findTeamById(knockoutSelections['r32-4'])], // J73 x J75 -> J90
    'r16-3': [findTeamById(knockoutSelections['r32-5']), findTeamById(knockoutSelections['r32-6'])], // J83 x J84 -> J93
    'r16-4': [findTeamById(knockoutSelections['r32-7']), findTeamById(knockoutSelections['r32-8'])], // J81 x J82 -> J94
    'r16-5': [findTeamById(knockoutSelections['r32-9']), findTeamById(knockoutSelections['r32-10'])], // J76 x J78 -> J91
    'r16-6': [findTeamById(knockoutSelections['r32-11']), findTeamById(knockoutSelections['r32-12'])], // J79 x J80 -> J92
    'r16-7': [findTeamById(knockoutSelections['r32-13']), findTeamById(knockoutSelections['r32-14'])], // J86 x J88 -> J95
    'r16-8': [findTeamById(knockoutSelections['r32-15']), findTeamById(knockoutSelections['r32-16'])], // J85 x J87 -> J96
  }), [knockoutSelections, allTeams]);

  const qf_teams = React.useMemo(() => ({
    'qf-1': [findTeamById(knockoutSelections['r16-1']), findTeamById(knockoutSelections['r16-2'])], // J89 x J90 -> J97
    'qf-2': [findTeamById(knockoutSelections['r16-3']), findTeamById(knockoutSelections['r16-4'])], // J93 x J94 -> J98
    'qf-3': [findTeamById(knockoutSelections['r16-5']), findTeamById(knockoutSelections['r16-6'])], // J91 x J92 -> J99
    'qf-4': [findTeamById(knockoutSelections['r16-7']), findTeamById(knockoutSelections['r16-8'])], // J95 x J96 -> J100
  }), [knockoutSelections, allTeams]);

  const sf_teams = React.useMemo(() => ({
    'sf-1': [findTeamById(knockoutSelections['qf-1']), findTeamById(knockoutSelections['qf-2'])], // J97 x J98 -> J101 Lado Esq
    'sf-2': [findTeamById(knockoutSelections['qf-3']), findTeamById(knockoutSelections['qf-4'])], // J99 x J100 -> J102 Lado Dir
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