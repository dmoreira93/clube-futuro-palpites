// src/types/matches.ts

import { Prediction } from "./predictions";

export type Team = {
  id: string;
  name: string;
  group_id?: string; // Group ID as optional
  flag_url?: string; // Flag URL as optional
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
  predictions?: Prediction[]; // Made predictions optional
  stage: string;
  stadium?: string | null; // Add stadium property
};

// --- ADICIONE O TIPO ABAIXO ---

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
};