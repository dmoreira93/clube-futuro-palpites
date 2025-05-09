import { Prediction } from "./predictions";

export type Team = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: Team;
  away_team?: Team;
  home_score: number | null;
  away_score: number | null;
  is_finished: boolean;
  predictions: Prediction[];
  stage: string;
};

