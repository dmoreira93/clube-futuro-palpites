// src/types/matches.ts

import { Prediction } from "./predictions";

export type Team = {
  id: string;
  name: string;
  group_id?: string;
  flag_url?: string;
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
  predictions?: Prediction[];
  stage: string;
  stadium?: string | null;
};

export type Pool = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  prize_percent_1st: number;
  prize_percent_2nd: number;
  prize_percent_3rd: number;
  enable_punishment: boolean;
  punishment_description: string | null;
  entry_fee: number;
  payment_required: boolean; // NOVO CAMPO
  prediction_deadline: string | null; // Adicionado para consistência
};