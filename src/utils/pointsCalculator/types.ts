// src/utils/pointsCalculator/types.ts

// Tipos base para resultados e palpites
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

// Critérios de pontuação
export type ScoringCriteria = {
  name: string; // Ex: 'Placar exato', 'Acertar vencedor'
  points: number;
  // Se você tem 'id' e 'description' no DB, inclua aqui:
  id?: string;
  description?: string;
};

// Resultado do cálculo de pontos para um palpite
export type PointsResult = {
  userId: string;
  matchId: string;
  predictionId: string; // ID do palpite que gerou esses pontos
  points: number;
  pointsType: PointsType; // Usando o enum PointsType
};

// Enum para os tipos de pontuação
export enum PointsType {
  EXACT_SCORE = "exact_score",
  CORRECT_WINNER = "correct_winner",
  PARTIAL_SCORE = "partial_score",
  NO_POINTS = "no_points"
}

// Tipo para usuários personalizados (vindo da tabela 'users_custom')
export type User = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null; // avatar_url pode ser nulo
  is_admin: boolean; // ESSENCIAL para filtrar administradores
};

// Tipo para dados de um time (vindo da tabela 'teams')
export type Team = {
  id: string;
  name: string;
  flag_url: string | null; // Pode ser nulo
  group_id: string | null; // Pode ser nulo
  // Se o grupo é aninhado, adicione:
  group?: {
    name: string;
  } | null;
};


// Tipo para resultados de partidas vindas do Supabase, com relações aninhadas
export type SupabaseMatchResultFromMatches = {
  id: string;
  match_date: string; // Data e hora da partida (ISO string)
  stage: string; // Fase da competição (ex: 'Grupo A', 'Semifinal')
  home_team_id: string;
  away_team_id: string;
  home_score: number | null; // Pode ser nulo se a partida não terminou
  away_score: number | null; // Pode ser nulo se a partida não terminou
  is_finished: boolean; // Indica se a partida foi finalizada

  // Relações aninhadas para home_team e away_team, como buscado no dataAccess
  home_team: Team | null; // Ou remova '| null' se sempre houver times
  away_team: Team | null; // Ou remova '| null' se sempre houver times
};

// Tipo para palpites de partida vindos do Supabase, com relações aninhadas
export type SupabaseMatchPrediction = {
  id: string;
  match_id: string;
  user_id: string;
  home_score: number;
  away_score: number;
  created_at: string; // Timestamp de criação do palpite

  // Se você busca dados de usuário ou partida junto com o palpite, adicione aqui
  user?: User | null; // Pode ser opcional ou nulo se não for sempre buscado
  match?: SupabaseMatchResultFromMatches | null; // Pode ser opcional ou nulo
};

// Adicione aqui outros tipos que você tenha, como para palpites de grupo,
// palpites de fase final, etc., se forem relevantes.
// Exemplo:
/*
export type GroupPrediction = {
  id: string;
  user_id: string;
  group_id: string;
  predicted_first_team_id: string;
  predicted_second_team_id: string;
  // Relações aninhadas
  group?: { name: string } | null;
  predicted_first_team?: Team | null;
  predicted_second_team?: Team | null;
};

export type FinalPhasePrediction = {
  id: string;
  user_id: string;
  champion_team_id: string;
  runner_up_team_id: string;
  third_place_team_id: string;
  fourth_place_team_id: string;
  final_home_score: number;
  final_away_score: number;
  // Relações aninhadas
  champion?: Team | null;
  runner_up?: Team | null;
  third_place?: Team | null;
  fourth_place?: Team | null;
};
*/