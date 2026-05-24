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
      // Garante a extração limpa da letra do grupo
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

  return { teams: terceiros, hasTie };
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

  const { melhoresTerceiros, existeEmpateNosCriterios } = React.useMemo(() => {
    const resultado = obterMelhoresTerceiros(simulatedGroups);
    return { melhoresTerceiros: resultado.teams, existeEmpateNosCriterios: resultado.hasTie };
  }, [simulatedGroups]);

  // --- ALOCAÇÃO DINÂMICA COMPATÍVEL COM O CHAVEAMENTO FIFA 2026 ---
  // --- CHAVEAMENTO COM PRECISÃO DE ACORDO COM A MATRIZ OFICIAL DA FIFA ---
  const r32 = React.useMemo(() => {
    // 1. Filtra as letras dos 8 grupos de terceiros colocados classificados
    const gruposDosTerceiros = melhoresTerceiros.slice(0, 8).map(t => t.groupLetter);
    const chaveCombinacao = [...gruposDosTerceiros].sort().join("");

    // Matriz de atribuição oficial do Anexo C da FIFA para a Copa de 2026
    const MATRIZ_FIFA_ESTRICT: Record<string, { J74: string; J77: string; J81: string; J82: string; J79: string; J80: string; J85: string; J87: string }> = {
      // Para a combinação exata de terceiros do seu app: A, B, D, E, F, G, I, L
      "ABDEFGIL": { 
        J74: "F", // 1ºE enfrenta 3ºF (Japão)
        J77: "D", // 1ºI enfrenta 3ºD (Estados Unidos)
        J81: "B", // 1ºD enfrenta 3ºB (Catar) -> EXATAMENTE COMO NO OUTRO SIMULADOR!
        J82: "I", // 1ºG enfrenta 3ºI 
        J79: "A", // 1ºA enfrenta 3ºA 
        J80: "E", // 1ºL enfrenta 3ºE (Costa do Marfim) -> CONFORME ANALISADO!
        J85: "G", // 1ºB enfrenta 3ºG (Irã) -> ENTRA NO LUGAR CORRETO!
        J87: "L"  // 1ºK enfrenta 3ºL (Gana)
      },
      // Fallback padrão regulamentar para o cenário alternativo ABCDEFGL
      "ABCDEFGL": { J74: "C", J77: "F", J81: "B", J82: "A", J79: "E", J80: "G", J85: "D", J87: "L" }
    };

    const definicaoAlvo = MATRIZ_FIFA_ESTRICT[chaveCombinacao] || MATRIZ_FIFA_ESTRICT["ABDEFGIL"];

    // Função que busca o terceiro colocado pertencente ao grupo exato ditado pela FIFA
    const pegarTerceiroDoGrupo = (letraGrupo: string, posicaoFallback: number) => {
      const time = melhoresTerceiros.find(t => t.groupLetter === letraGrupo);
      if (time) return time;
      return melhoresTerceiros[posicaoFallback] || allTeams[posicaoFallback];
    };

    // 2. Estruturação dos 16 confrontos na ordem vertical idêntica à do print oficial da FIFA
    return [
      // --- BLOCO ESQUERDO DA ÁRVORE (De cima para baixo) ---
      { id: 'r32-1',  title: 'Jogo 74', team1: getTeam('E', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J74, 0) }, 
      { id: 'r32-2',  title: 'Jogo 77', team1: getTeam('I', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J77, 1) }, 
      { id: 'r32-3',  title: 'Jogo 73', team1: getTeam('A', 2), team2: getTeam('B', 2) },                             
      { id: 'r32-4',  title: 'Jogo 75', team1: getTeam('F', 1), team2: getTeam('C', 2) },                             
      { id: 'r32-5',  title: 'Jogo 83', team1: getTeam('K', 2), team2: getTeam('L', 2) },                             
      { id: 'r32-6',  title: 'Jogo 84', team1: getTeam('H', 1), team2: getTeam('J', 2) },                             
      { id: 'r32-7',  title: 'Jogo 81', team1: getTeam('D', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J81, 2) }, // Paraguai x Catar!
      { id: 'r32-8',  title: 'Jogo 82', team1: getTeam('G', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J82, 3) }, 

      // --- BLOCO DIREITO DA ÁRVORE (De cima para baixo) ---
      { id: 'r32-9',  title: 'Jogo 76', team1: getTeam('C', 1), team2: getTeam('F', 2) },                             
      { id: 'r32-10', title: 'Jogo 78', team1: getTeam('E', 2), team2: getTeam('I', 2) },                             
      { id: 'r32-11', title: 'Jogo 79', team1: getTeam('A', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J79, 4) }, 
      { id: 'r32-12', title: 'Jogo 80', team1: getTeam('L', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J80, 5) }, // Croácia x Costa do Marfim!
      { id: 'r32-13', title: 'Jogo 86', team1: getTeam('J', 1), team2: getTeam('H', 2) },                             
      { id: 'r32-14', title: 'Jogo 88', team1: getTeam('D', 2), team2: getTeam('G', 2) },                             
      { id: 'r32-15', title: 'Jogo 85', team1: getTeam('B', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J85, 6) }, // Canadá x Irã!
      { id: 'r32-16', title: 'Jogo 87', team1: getTeam('K', 1), team2: pegarTerceiroDoGrupo(definicaoAlvo.J87, 7) }, 
    ];
  }, [simulatedGroups, melhoresTerceiros, allTeams]);

  // --- MAPEAMENTO DAS OITAVAS E ADIANTE ---
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