
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
