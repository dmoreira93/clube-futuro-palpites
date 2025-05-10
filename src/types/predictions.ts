
export type User = {
  name: string;
  id?: string;
};

export type Prediction = {
  id: string;
  home_score: number;
  away_score: number;
  user_id: string;
  match_id: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  users?: { name: string }; // Adding this to accommodate both formats from the database
};

export type GroupPrediction = {
  id?: string;
  group_id: string;
  first_team_id: string;
  second_team_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
};

export type FinalPrediction = {
  id?: string;
  champion_id: string;
  vice_champion_id: string;
  third_place_id: string;
  fourth_place_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
};
