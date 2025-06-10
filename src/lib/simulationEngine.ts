// src/lib/simulationEngine.ts

// --- Tipos de Dados para a Simulação ---

// Interface para os palpites de jogos que vamos receber
interface UserMatchPrediction {
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
}

// Interface para as estatísticas de um time em um grupo simulado
export interface SimulatedTeamStats {
  teamId: string;
  teamName: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

// Interface para o resultado final da simulação de um grupo
export interface SimulatedGroup {
  groupId: string;
  groupName: string;
  standings: SimulatedTeamStats[];
}

// Interface para todos os times do torneio
interface Team {
  id: string;
  name: string;
  group_id: string;
}

// --- A Função Principal de Cálculo ---

/**
 * Calcula a classificação dos grupos com base nos palpites de um usuário.
 * @param predictions - A lista de palpites de jogos do usuário.
 * @param allTeams - A lista completa de times do torneio.
 * @param allGroups - A lista de todos os grupos.
 * @returns Um array com a classificação simulada de cada grupo.
 */
export function calculateGroupStandings(
  predictions: UserMatchPrediction[],
  allTeams: Team[],
  allGroups: { id: string, name: string }[]
): SimulatedGroup[] {
  // 1. Inicializa as estatísticas para todos os times, zeradas
  const teamStatsMap: Map<string, SimulatedTeamStats> = new Map();
  allTeams.forEach(team => {
    teamStatsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    });
  });

  // 2. Itera sobre cada palpite para calcular os resultados
  predictions.forEach(prediction => {
    // Ignora palpites não preenchidos
    if (prediction.home_score === null || prediction.away_score === null) {
      return;
    }

    const homeTeamStats = teamStatsMap.get(prediction.home_team_id);
    const awayTeamStats = teamStatsMap.get(prediction.away_team_id);

    if (!homeTeamStats || !awayTeamStats) return;

    // Atualiza estatísticas básicas
    homeTeamStats.gamesPlayed += 1;
    awayTeamStats.gamesPlayed += 1;
    homeTeamStats.goalsFor += prediction.home_score;
    homeTeamStats.goalsAgainst += prediction.away_score;
    awayTeamStats.goalsFor += prediction.away_score;
    awayTeamStats.goalsAgainst += prediction.home_score;
    homeTeamStats.goalDifference = homeTeamStats.goalsFor - homeTeamStats.goalsAgainst;
    awayTeamStats.goalDifference = awayTeamStats.goalsFor - awayTeamStats.goalsAgainst;

    // Calcula pontos (3 para vitória, 1 para empate)
    if (prediction.home_score > prediction.away_score) {
      homeTeamStats.points += 3;
      homeTeamStats.wins += 1;
      awayTeamStats.losses += 1;
    } else if (prediction.home_score < prediction.away_score) {
      awayTeamStats.points += 3;
      awayTeamStats.wins += 1;
      homeTeamStats.losses += 1;
    } else {
      homeTeamStats.points += 1;
      awayTeamStats.points += 1;
      homeTeamStats.draws += 1;
      awayTeamStats.draws += 1;
    }
  });

  // 3. Agrupa os times por grupo e ordena a classificação
  const simulatedGroups: SimulatedGroup[] = allGroups.map(group => {
    const teamsInGroup = allTeams
      .filter(team => team.group_id === group.id)
      .map(team => teamStatsMap.get(team.id)!);

    // Ordena a classificação usando os critérios de desempate
    teamsInGroup.sort((a, b) => {
      // 1. Pontos
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      // 2. Saldo de Gols
      if (a.goalDifference !== b.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      // 3. Gols Pró
      if (a.goalsFor !== b.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      // 4. Ordem alfabética como último recurso
      return a.teamName.localeCompare(b.teamName);
    });

    return {
      groupId: group.id,
      groupName: group.name,
      standings: teamsInGroup,
    };
  });

  return simulatedGroups;
}