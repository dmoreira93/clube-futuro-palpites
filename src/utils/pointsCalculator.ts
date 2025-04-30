
/**
 * Utilitário para cálculo de pontos com base nos critérios definidos
 */

// Pontos para diferentes tipos de acertos
export enum PointsType {
  EXACT_SCORE = "EXACT_SCORE", // Placar exato
  CORRECT_WINNER = "CORRECT_WINNER", // Vencedor correto
  CORRECT_DRAW = "CORRECT_DRAW", // Empate correto
  PARTIAL_SCORE = "PARTIAL_SCORE", // Acertou gols de um dos times
  NO_POINTS = "NO_POINTS" // Sem pontos
}

// Critérios e pontuações padrão
export const DEFAULT_POINTS = {
  [PointsType.EXACT_SCORE]: 10,
  [PointsType.CORRECT_WINNER]: 7,
  [PointsType.CORRECT_DRAW]: 7,
  [PointsType.PARTIAL_SCORE]: 2,
  [PointsType.NO_POINTS]: 0
};

/**
 * Calcula o resultado de um palpite baseado nos critérios
 * @param predictionHome Gols previstos para o time da casa
 * @param predictionAway Gols previstos para o time visitante
 * @param actualHome Gols reais do time da casa
 * @param actualAway Gols reais do time visitante
 * @returns Tipo de acerto e pontos obtidos
 */
export const calculatePoints = (
  predictionHome: number,
  predictionAway: number,
  actualHome: number,
  actualAway: number,
  pointsConfig = DEFAULT_POINTS
): { type: PointsType; points: number } => {
  // Acertou o placar exato
  if (predictionHome === actualHome && predictionAway === actualAway) {
    return {
      type: PointsType.EXACT_SCORE,
      points: pointsConfig[PointsType.EXACT_SCORE]
    };
  }

  // Verificar se acertou o vencedor ou empate
  const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const predictionWinner = predictionHome > predictionAway ? "home" : predictionHome < predictionAway ? "away" : "draw";

  if (actualWinner === predictionWinner) {
    if (actualWinner === "draw") {
      return {
        type: PointsType.CORRECT_DRAW,
        points: pointsConfig[PointsType.CORRECT_DRAW]
      };
    } else {
      return {
        type: PointsType.CORRECT_WINNER,
        points: pointsConfig[PointsType.CORRECT_WINNER]
      };
    }
  }

  // Acertou o número de gols de um time
  if (predictionHome === actualHome || predictionAway === actualAway) {
    return {
      type: PointsType.PARTIAL_SCORE,
      points: pointsConfig[PointsType.PARTIAL_SCORE]
    };
  }

  // Não acertou nada
  return {
    type: PointsType.NO_POINTS,
    points: 0
  };
};

/**
 * Função para calcular e atualizar os pontos no Supabase
 * Esta função será chamada após o registro de um resultado
 */
export const updateUserPoints = async (matchId: string) => {
  // Implementação futura para atualizar pontos no banco de dados
  console.log(`Atualizando pontos para o jogo ${matchId}`);
  
  // Aqui haveria a lógica para:
  // 1. Buscar o resultado do jogo
  // 2. Buscar todos os palpites para o jogo
  // 3. Calcular os pontos de cada usuário
  // 4. Atualizar o banco de dados com os pontos
};
