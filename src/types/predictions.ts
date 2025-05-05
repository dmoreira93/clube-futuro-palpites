
export type User = {
  name: string;
};

export type Prediction = {
  id: string;
  home_score: number;
  away_score: number;
  user_id: string;
  user?: User;
};
