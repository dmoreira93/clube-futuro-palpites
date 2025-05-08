
export type MatchResult = {
  id: string;
  home_score: number;
  away_score: number;
};

export type Prediction = {
  id: string;
  match_id: string;
  user_id: string;
  home_score: number;
  away_score: number;
};

export type ScoringCriteria = {
  id: string;
  name: string;
  description: string;
  points: number;
};

export type PointsResult = {
  userId: string;
  matchId: string;
  predictionId: string;
  points: number;
  pointsType: string;
};

// Tipos de pontuação disponíveis
export enum PointsType {
  EXACT_SCORE = "exact_score",
  CORRECT_WINNER = "correct_winner",
  PARTIAL_SCORE = "partial_score", 
  NO_POINTS = "no_points"
}
