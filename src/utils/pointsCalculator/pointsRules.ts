
import { MatchResult, Prediction, PointsResult } from "./types";

/**
 * Calcula os pontos para um acerto exato (placar e vencedor corretos)
 */
export function calculateExactScorePoints(
  prediction: Prediction,
  match: MatchResult,
  exactScorePoints: number
): PointsResult | null {
  if (
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score
  ) {
    return {
      userId: prediction.user_id,
      matchId: prediction.match_id,
      predictionId: prediction.id,
      points: exactScorePoints,
      pointsType: "exact_score",
    };
  }
  return null;
}

/**
 * Calcula os pontos para acertar apenas o vencedor/empate
 */
export function calculateWinnerPoints(
  prediction: Prediction,
  match: MatchResult,
  winnerPoints: number
): PointsResult | null {
  // Resultado real
  const actualWinner = match.home_score > match.away_score ? "home" : 
                        match.home_score < match.away_score ? "away" : "draw";
  
  // Palpite
  const predictedWinner = prediction.home_score > prediction.away_score ? "home" : 
                          prediction.home_score < prediction.away_score ? "away" : "draw";
  
  if (actualWinner === predictedWinner) {
    return {
      userId: prediction.user_id,
      matchId: prediction.match_id,
      predictionId: prediction.id,
      points: winnerPoints,
      pointsType: "correct_winner",
    };
  }
  return null;
}

/**
 * Calcula os pontos para acertar o placar de um dos times
 */
export function calculatePartialScorePoints(
  prediction: Prediction,
  match: MatchResult,
  partialScorePoints: number
): PointsResult | null {
  if (
    (prediction.home_score === match.home_score || 
     prediction.away_score === match.away_score) &&
    !(prediction.home_score === match.home_score && 
      prediction.away_score === match.away_score)
  ) {
    return {
      userId: prediction.user_id,
      matchId: prediction.match_id,
      predictionId: prediction.id,
      points: partialScorePoints,
      pointsType: "partial_score",
    };
  }
  return null;
}

/**
 * Determina a quantidade máxima de pontos com base nas regras de prioridade
 */
export function calculateMaximumPoints(
  prediction: Prediction,
  match: MatchResult,
  exactScorePoints: number,
  winnerPoints: number,
  partialScorePoints: number
): PointsResult | null {
  // Tentar aplicar as regras em ordem de prioridade
  const exactScore = calculateExactScorePoints(prediction, match, exactScorePoints);
  if (exactScore) return exactScore;
  
  const winner = calculateWinnerPoints(prediction, match, winnerPoints);
  if (winner) return winner;
  
  const partialScore = calculatePartialScorePoints(prediction, match, partialScorePoints);
  if (partialScore) return partialScore;
  
  // Nenhum ponto
  return {
    userId: prediction.user_id,
    matchId: prediction.match_id,
    predictionId: prediction.id,
    points: 0,
    pointsType: "no_points",
  };
}
